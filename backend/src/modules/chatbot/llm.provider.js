import { AppError } from '../../utils/AppError.js';

const LLM_TIMEOUT_MS = 25_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

const FRIENDLY_OVERLOADED_MSG =
  'Hệ thống AI đang có nhiều người truy cập cùng lúc, bạn vui lòng thử gửi lại sau vài giây nhé!';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFriendlyApiError(status, providerKey) {
  if (RETRYABLE_STATUS_CODES.has(status)) {
    return new AppError(503, `${providerKey}_OVERLOADED`, FRIENDLY_OVERLOADED_MSG);
  }
  if (status === 401 || status === 403) {
    return new AppError(
      502,
      `${providerKey}_AUTH_ERROR`,
      'Khóa kết nối API của hệ thống AI chưa hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình.'
    );
  }
  if (status === 404) {
    return new AppError(
      502,
      `${providerKey}_MODEL_NOT_FOUND`,
      'Model AI đang cấu hình không tồn tại hoặc không được hỗ trợ. Vui lòng kiểm tra lại tên Model.'
    );
  }
  if (status === 400) {
    return new AppError(
      400,
      `${providerKey}_BAD_REQUEST`,
      'Yêu cầu gửi đến hệ thống AI chưa hợp lệ. Bạn vui lòng thử diễn đạt lại câu hỏi nhé!'
    );
  }
  return new AppError(
    502,
    `${providerKey}_API_ERROR`,
    'Hệ thống AI đang tạm thời gián đoạn, bạn vui lòng thử gửi lại sau vài giây nhé!'
  );
}

async function fetchJsonWithRetry(url, fetchOptions, { providerKey, providerLabel }) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = new AppError(
        502,
        `${providerKey}_CONNECTION_ERROR`,
        `Không thể kết nối đến ${providerLabel} (${err?.name === 'TimeoutError' ? 'quá thời gian chờ' : 'lỗi mạng'}). Bạn vui lòng thử lại sau vài giây nhé!`
      );
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw lastError;
    }

    const data = await res.json().catch(() => null);

    if (res.ok) {
      return { res, data };
    }

    if (RETRYABLE_STATUS_CODES.has(res.status)) {
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw buildFriendlyApiError(res.status, providerKey);
    }

    throw buildFriendlyApiError(res.status, providerKey);
  }

  throw lastError || new AppError(503, `${providerKey}_OVERLOADED`, FRIENDLY_OVERLOADED_MSG);
}

async function callOpenAICompatible({
  endpoint,
  providerKey,
  providerLabel,
  defaultModel,
  apiKey,
  model,
  systemPrompt,
  messages,
}) {
  const start = Date.now();
  const targetModel = model || defaultModel;
  const payload = {
    model: targetModel,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map((m) => ({
        role: m.sender_type === 'BOT' ? 'assistant' : 'user',
        content: m.message_text,
      })),
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const { data } = await fetchJsonWithRetry(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    },
    { providerKey, providerLabel }
  );

  const latencyMs = Date.now() - start;
  const replyText = data?.choices?.[0]?.message?.content?.trim();
  if (!replyText) {
    throw new AppError(
      502,
      `${providerKey}_EMPTY_RESPONSE`,
      'Trợ lý AI chưa thể tạo câu trả lời lúc này. Bạn vui lòng thử gửi lại nhé!'
    );
  }

  const inputTokens = Number(data?.usage?.prompt_tokens) || 0;
  const outputTokens = Number(data?.usage?.completion_tokens) || 0;
  const totalTokens = Number(data?.usage?.total_tokens) || inputTokens + outputTokens;

  return {
    provider: providerKey,
    model: data?.model || targetModel,
    replyText,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs,
  };
}

async function callOpenAI({ apiKey, model, systemPrompt, messages }) {
  return callOpenAICompatible({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    providerKey: 'OPENAI',
    providerLabel: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    apiKey,
    model,
    systemPrompt,
    messages,
  });
}

async function callGroq({ apiKey, model, systemPrompt, messages }) {
  return callOpenAICompatible({
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    providerKey: 'GROQ',
    providerLabel: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    apiKey,
    model,
    systemPrompt,
    messages,
  });
}

async function callGemini({ apiKey, model, systemPrompt, messages }) {
  const start = Date.now();
  const targetModel = model || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    ...(systemPrompt
      ? {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        }
      : {}),
    contents: messages.map((m) => ({
      role: m.sender_type === 'BOT' ? 'model' : 'user',
      parts: [{ text: m.message_text }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const { data } = await fetchJsonWithRetry(
    endpoint,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { providerKey: 'GEMINI', providerLabel: 'Google Gemini' }
  );

  const latencyMs = Date.now() - start;
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const replyText = parts
    .map((p) => p?.text || '')
    .join('')
    .trim();

  if (!replyText) {
    throw new AppError(
      502,
      'GEMINI_EMPTY_RESPONSE',
      'Trợ lý AI chưa thể tạo câu trả lời lúc này. Bạn vui lòng thử gửi lại nhé!'
    );
  }

  const inputTokens = Number(data?.usageMetadata?.promptTokenCount) || 0;
  const outputTokens = Number(data?.usageMetadata?.candidatesTokenCount) || 0;
  const totalTokens = Number(data?.usageMetadata?.totalTokenCount) || inputTokens + outputTokens;

  return {
    provider: 'GEMINI',
    model: targetModel,
    replyText,
    inputTokens,
    outputTokens,
    totalTokens,
    latencyMs,
  };
}

/**
 * Unified Q&A LLM invocation supporting OpenAI, Google Gemini, and Groq (OpenAI-compatible).
 * Automatically retries up to 2 times (1.5s interval) on HTTP 429 / 503.
 */
export async function generateChatReply({ provider, apiKey, model, systemPrompt, messages }) {
  const normalized = String(provider || 'OPENAI').trim().toUpperCase();
  if (!apiKey || !apiKey.trim()) {
    throw new AppError(
      503,
      'CHATBOT_NOT_CONFIGURED',
      `Chưa cấu hình API Key cho nhà cung cấp ${normalized}. Vui lòng cấu hình trong mục Quản lý Chatbot AI.`
    );
  }

  if (normalized === 'GEMINI') {
    return callGemini({ apiKey, model, systemPrompt, messages });
  }
  if (normalized === 'GROQ') {
    return callGroq({ apiKey, model, systemPrompt, messages });
  }
  return callOpenAI({ apiKey, model, systemPrompt, messages });
}
