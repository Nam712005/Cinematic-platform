import { decryptSecret, encryptSecret, maskSecret } from '../../config/crypto.js';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import {
  buildGroundedChatbotPrompt,
  extractSuggestedMoviesFromReply,
} from './chatbot.context.js';
import * as repo from './chatbot.repository.js';
import { generateChatReply } from './llm.provider.js';

function safeDecrypt(rawVal) {
  if (!rawVal || typeof rawVal !== 'string' || rawVal.trim() === '') {
    return '';
  }
  try {
    return decryptSecret(rawVal);
  } catch {
    return '';
  }
}

function normalizeProvider(raw) {
  const upper = String(raw || 'OPENAI').trim().toUpperCase();
  if (upper === 'GEMINI') return 'GEMINI';
  if (upper === 'GROQ') return 'GROQ';
  return 'OPENAI';
}

function resolveProviderConfig(cfg, provider) {
  const norm = normalizeProvider(provider);
  if (norm === 'GEMINI') {
    return { provider: 'GEMINI', apiKey: cfg.geminiApiKey, model: cfg.geminiModel };
  }
  if (norm === 'GROQ') {
    return { provider: 'GROQ', apiKey: cfg.groqApiKey, model: cfg.groqModel };
  }
  return { provider: 'OPENAI', apiKey: cfg.openaiApiKey, model: cfg.openaiModel };
}

async function loadInternalChatbotConfig() {
  const raw = await repo.getChatbotRawSettings();
  const str = (k, fallback = '') => String(raw[k]?.setting_value ?? fallback);
  const bool = (k, fallback = true) => {
    if (!raw[k]) return fallback;
    return String(raw[k].setting_value).toLowerCase() === 'true' || raw[k].setting_value === '1';
  };

  const activeProvider = normalizeProvider(str('chatbot_provider', 'OPENAI'));

  return {
    isEnabled: bool('chatbot_enabled', true),
    activeProvider,
    openaiModel: str('chatbot_openai_model', 'gpt-4o-mini'),
    openaiApiKey: safeDecrypt(raw.chatbot_openai_api_key?.setting_value),
    geminiModel: str('chatbot_gemini_model', 'gemini-2.0-flash'),
    geminiApiKey: safeDecrypt(raw.chatbot_gemini_api_key?.setting_value),
    groqModel: str('chatbot_groq_model', 'llama-3.3-70b-versatile'),
    groqApiKey: safeDecrypt(raw.chatbot_groq_api_key?.setting_value),
    displayName: str('chatbot_display_name', 'CINEMATIC AI'),
    greetingMessage: str(
      'chatbot_greeting',
      'Xin chào! Tôi là trợ lý hỏi đáp CINEMATIC AI.'
    ),
    systemPrompt: str(
      'chatbot_system_prompt',
      'Bạn là trợ lý hỏi đáp của website xem phim CINEMATIC. Chỉ giải đáp câu hỏi bằng tiếng Việt lịch sự, ngắn gọn.'
    ),
  };
}

// ---------- MEMBER MULTI-SESSION CHAT (UI11) ----------
export async function listMySessions(userId) {
  return repo.listSessionsByUser(userId);
}

export async function createMySession(userId, { session_title }) {
  const cfg = await loadInternalChatbotConfig();
  const { model: activeModel } = resolveProviderConfig(cfg, cfg.activeProvider);
  return repo.createSession(userId, {
    title: session_title?.trim() || 'Cuộc trò chuyện mới',
    provider: cfg.activeProvider,
    model: activeModel,
  });
}

async function assertSessionOwnership(sessionId, userId) {
  const session = await repo.findSessionById(sessionId);
  if (!session || session.status !== 1) {
    throw new AppError(404, 'CHAT_SESSION_NOT_FOUND', 'Không tìm thấy phiên hội thoại.');
  }
  if (session.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập phiên hội thoại của tài khoản khác.');
  }
  return session;
}

export async function getSessionMessages(sessionId, userId) {
  const session = await assertSessionOwnership(sessionId, userId);
  const messages = await repo.listMessagesBySession(sessionId);
  return { session, messages };
}

export async function deleteMySession(sessionId, userId) {
  await assertSessionOwnership(sessionId, userId);
  await repo.deleteSessionById(sessionId);
}

export async function sendMessageInSession(
  sessionId,
  userId,
  { message, currentMovieSlug, current_movie_slug }
) {
  const session = await assertSessionOwnership(sessionId, userId);
  const cfg = await loadInternalChatbotConfig();
  const activeMovieSlug = currentMovieSlug || current_movie_slug || null;

  if (!cfg.isEnabled) {
    throw new AppError(503, 'CHATBOT_DISABLED', 'Trợ lý CINEMATIC AI hiện đang tạm tắt.');
  }

  const { apiKey: activeKey, model: activeModel } = resolveProviderConfig(cfg, cfg.activeProvider);

  if (!activeKey) {
    throw new AppError(
      503,
      'CHATBOT_NOT_CONFIGURED',
      'Trợ lý AI chưa được cấu hình khóa kết nối. Vui lòng thử lại sau.'
    );
  }

  const userMsg = await repo.insertMessage({
    sessionId,
    senderType: 'USER',
    messageText: message,
    provider: cfg.activeProvider,
    modelName: activeModel,
    messageStatus: 'SUCCESS',
  });

  const contextMessages = await repo.getRecentMessagesForContext(sessionId, 10);
  const autoTitle =
    session.total_messages === 0 && (!session.session_title || session.session_title === 'Cuộc trò chuyện mới')
      ? message.slice(0, 80)
      : null;

  try {
    const {
      systemPrompt: groundedSystemPrompt,
      candidateMovies,
      currentMovie,
    } = await buildGroundedChatbotPrompt({
      userMessage: message,
      baseSystemPrompt: cfg.systemPrompt,
      currentMovieSlug: activeMovieSlug,
    });

    const aiReply = await generateChatReply({
      provider: cfg.activeProvider,
      apiKey: activeKey,
      model: activeModel,
      systemPrompt: groundedSystemPrompt,
      messages: contextMessages,
    });

    const suggestedMovies = extractSuggestedMoviesFromReply(
      aiReply.replyText,
      candidateMovies,
      currentMovie?.id || null,
      4
    );

    const botMsg = await repo.insertMessage({
      sessionId,
      senderType: 'BOT',
      messageText: aiReply.replyText,
      provider: aiReply.provider,
      modelName: aiReply.model,
      inputTokens: aiReply.inputTokens,
      outputTokens: aiReply.outputTokens,
      tokensUsed: aiReply.totalTokens,
      latencyMs: aiReply.latencyMs,
      messageStatus: 'SUCCESS',
    });

    await repo.updateSessionMeta(sessionId, {
      title: autoTitle,
      provider: aiReply.provider,
      model: aiReply.model,
    });

    const updatedSession = await repo.findSessionById(sessionId);
    return {
      session: updatedSession,
      user_message: userMsg,
      bot_message: {
        ...botMsg,
        suggestedMovies,
      },
      reply: aiReply.replyText,
      suggestedMovies,
    };
  } catch (err) {
    await repo.insertMessage({
      sessionId,
      senderType: 'BOT',
      messageText:
        err?.message || 'Xin lỗi, trợ lý AI đang gặp sự cố kết nối. Vui lòng thử lại sau.',
      provider: cfg.activeProvider,
      modelName: activeModel,
      messageStatus: 'ERROR',
    });
    await repo.updateSessionMeta(sessionId, {
      title: autoTitle,
      provider: cfg.activeProvider,
      model: activeModel,
    });
    throw err;
  }
}

// ---------- ADMIN CHATBOT CONFIG & STATS (UI23) ----------
export async function getAdminChatbotConfig() {
  const [cfg, stats] = await Promise.all([loadInternalChatbotConfig(), repo.getChatbotUsageStats()]);

  const { model: activeModel } = resolveProviderConfig(cfg, cfg.activeProvider);

  return {
    is_enabled: cfg.isEnabled,
    active_provider: cfg.activeProvider,
    active_model: activeModel,
    avg_latency_ms: stats.avg_latency_ms,
    openai_model: cfg.openaiModel,
    has_openai_key: Boolean(cfg.openaiApiKey),
    openai_key_configured: Boolean(cfg.openaiApiKey),
    openai_api_key_masked: maskSecret(cfg.openaiApiKey),
    gemini_model: cfg.geminiModel,
    has_gemini_key: Boolean(cfg.geminiApiKey),
    gemini_key_configured: Boolean(cfg.geminiApiKey),
    gemini_api_key_masked: maskSecret(cfg.geminiApiKey),
    groq_model: cfg.groqModel,
    has_groq_key: Boolean(cfg.groqApiKey),
    groq_key_configured: Boolean(cfg.groqApiKey),
    groq_api_key_masked: maskSecret(cfg.groqApiKey),
    display_name: cfg.displayName,
    greeting_message: cfg.greetingMessage,
    system_prompt: cfg.systemPrompt,
  };
}

export async function updateAdminChatbotConfig(payload, adminUser) {
  const providerVal = payload.active_provider ?? payload.provider ?? payload.ai_provider;
  const displayNameVal = payload.display_name ?? payload.bot_name;
  const greetingVal = payload.greeting_message ?? payload.welcome_message;

  await withTransaction(async (conn) => {
    const entries = [];
    if (payload.is_enabled !== undefined) {
      entries.push({ key: 'chatbot_enabled', value: String(payload.is_enabled), valueType: 'BOOLEAN' });
    }
    if (providerVal !== undefined) {
      entries.push({
        key: 'chatbot_provider',
        value: normalizeProvider(providerVal),
        valueType: 'STRING',
      });
    }
    if (payload.openai_model !== undefined) {
      entries.push({ key: 'chatbot_openai_model', value: payload.openai_model, valueType: 'STRING' });
    }
    if (payload.openai_api_key !== undefined && payload.openai_api_key.trim() !== '') {
      entries.push({
        key: 'chatbot_openai_api_key',
        value: encryptSecret(payload.openai_api_key.trim()),
        valueType: 'STRING',
        isEncrypted: 1,
      });
    }
    if (payload.gemini_model !== undefined) {
      entries.push({ key: 'chatbot_gemini_model', value: payload.gemini_model, valueType: 'STRING' });
    }
    if (payload.gemini_api_key !== undefined && payload.gemini_api_key.trim() !== '') {
      entries.push({
        key: 'chatbot_gemini_api_key',
        value: encryptSecret(payload.gemini_api_key.trim()),
        valueType: 'STRING',
        isEncrypted: 1,
      });
    }
    if (payload.groq_model !== undefined) {
      entries.push({ key: 'chatbot_groq_model', value: payload.groq_model, valueType: 'STRING' });
    }
    if (payload.groq_api_key !== undefined && payload.groq_api_key.trim() !== '') {
      entries.push({
        key: 'chatbot_groq_api_key',
        value: encryptSecret(payload.groq_api_key.trim()),
        valueType: 'STRING',
        isEncrypted: 1,
      });
    }
    if (displayNameVal !== undefined) {
      entries.push({ key: 'chatbot_display_name', value: displayNameVal, valueType: 'STRING' });
    }
    if (greetingVal !== undefined) {
      entries.push({ key: 'chatbot_greeting', value: greetingVal, valueType: 'STRING' });
    }
    if (payload.system_prompt !== undefined) {
      entries.push({ key: 'chatbot_system_prompt', value: payload.system_prompt, valueType: 'STRING' });
    }

    for (const item of entries) {
      await repo.upsertChatbotSetting(conn, { ...item, updatedBy: adminUser.id });
    }
  });

  return getAdminChatbotConfig();
}

export async function testAdminChatbotConnection(payload) {
  const cfg = await loadInternalChatbotConfig();
  const target = resolveProviderConfig(cfg, payload.provider || cfg.activeProvider);
  const model = payload.model || target.model;
  const apiKey =
    payload.api_key && payload.api_key.trim() !== '' ? payload.api_key.trim() : target.apiKey;

  const reply = await generateChatReply({
    provider: target.provider,
    apiKey,
    model,
    systemPrompt: 'Trả lời ngắn gọn: OK',
    messages: [{ sender_type: 'USER', message_text: 'Ping kiểm tra kết nối.' }],
  });

  return {
    connected: true,
    provider: reply.provider,
    model: reply.model,
    latency_ms: reply.latencyMs,
  };
}

export async function getAdminChatbotStats() {
  return repo.getChatbotUsageStats();
}
