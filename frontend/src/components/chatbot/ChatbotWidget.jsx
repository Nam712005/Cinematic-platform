import {
  Bot,
  Film,
  History,
  Loader2,
  LogIn,
  MessageSquarePlus,
  Play,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { chatbotApi } from '../../api/chatbotApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const BASE_QUICK_PROMPTS = [
  'Hôm nay mình hơi buồn, gợi ý phim xem giải trí nhé',
  'Gói Premium có những quyền lợi gì?',
  'Làm sao để tiếp tục xem phim đang xem dở?',
];

function extractMovieSlugFromPath(pathname) {
  const match = String(pathname || '').match(/^\/(?:movies?|watch)\/([^/?#]+)/i);
  if (!match || !match[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function renderFormattedBotText(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*\n]+?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatbotWidget() {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentMovieSlug = useMemo(
    () => extractMovieSlugFromPath(location.pathname),
    [location.pathname]
  );

  const quickPrompts = useMemo(() => {
    if (currentMovieSlug) {
      return ['Gợi ý phim tương tự bộ này', ...BASE_QUICK_PROMPTS.slice(0, 2)];
    }
    return BASE_QUICK_PROMPTS;
  }, [currentMovieSlug]);

  const [isOpen, setIsOpen] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const botName = settings.chatbot.chatbot_display_name || 'CINEMATIC AI';
  const greeting =
    settings.chatbot.chatbot_greeting ||
    'Xin chào! Tôi là trợ lý hỏi đáp CINEMATIC AI. Tôi có thể giải đáp câu hỏi về phim và hướng dẫn sử dụng website.';

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const loadSessionMessages = useCallback(
    async (sessionId) => {
      setLoadingMessages(true);
      try {
        const res = await chatbotApi.getMessages(sessionId);
        setMessages(res?.data?.messages || []);
        scrollToBottom();
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải lịch sử hội thoại.'));
      } finally {
        setLoadingMessages(false);
      }
    },
    [toast]
  );

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await chatbotApi.listSessions();
      const list = res?.data || [];
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0].id);
        loadSessionMessages(list[0].id);
      }
    } catch {
      // Silent fallback
    } finally {
      setLoadingSessions(false);
    }
  }, [activeSessionId, loadSessionMessages]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSessions();
    }
  }, [isOpen, isAuthenticated, loadSessions]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  const handleFloatingClick = () => {
    if (!isAuthenticated) {
      setShowGuestPrompt(true);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await chatbotApi.createSession({ session_title: 'Cuộc trò chuyện mới' });
      const created = res.data;
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      setMessages([]);
      setShowSessionList(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tạo phiên trò chuyện mới.'));
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setShowSessionList(false);
    loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await chatbotApi.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          loadSessionMessages(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa phiên hội thoại.'));
    }
  };

  const handleOpenSuggestedMovie = (slug) => {
    if (!slug) return;
    navigate(`/movies/${slug}`);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleSendMessage = async (customText) => {
    const text = (typeof customText === 'string' ? customText : inputText).trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    let targetSessionId = activeSessionId;
    try {
      if (!targetSessionId) {
        const createdRes = await chatbotApi.createSession({ session_title: text.slice(0, 60) });
        const created = createdRes.data;
        targetSessionId = created.id;
        setActiveSessionId(created.id);
        setSessions((prev) => [created, ...prev]);
      }

      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        sender_type: 'USER',
        message_text: text,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      scrollToBottom();

      const res = await chatbotApi.sendMessage(targetSessionId, text, currentMovieSlug);
      const { session: updatedSession, user_message, bot_message, suggestedMovies } = res.data;

      const enrichedBotMessage = {
        ...bot_message,
        suggestedMovies: Array.isArray(suggestedMovies)
          ? suggestedMovies
          : Array.isArray(bot_message?.suggestedMovies)
            ? bot_message.suggestedMovies
            : [],
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMsg.id),
        user_message,
        enrichedBotMessage,
      ]);
      if (updatedSession) {
        setSessions((prev) => [
          updatedSession,
          ...prev.filter((s) => s.id !== updatedSession.id),
        ]);
      }
      scrollToBottom();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể gửi câu hỏi tới trợ lý AI.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Guest Login/Register Prompt Modal */}
      {showGuestPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowGuestPrompt(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-cinema-card hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red/15 text-cinema-red">
              <Bot className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Đăng nhập để sử dụng {botName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Trợ lý hỏi đáp AI dành riêng cho thành viên có tài khoản tại CINEMATIC. Vui lòng đăng
              nhập hoặc tạo tài khoản mới để bắt đầu trò chuyện và lưu lại lịch sử hội thoại của
              bạn.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setShowGuestPrompt(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setShowGuestPrompt(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 dark:text-white dark:hover:border-slate-500"
              >
                <UserPlus className="h-4 w-4" />
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Member Multi-Session Chat Window */}
      {isOpen && isAuthenticated && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[540px] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cinema-border bg-cinema-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cinema-red text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{botName}</h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {currentMovieSlug ? 'Đang hiểu ngữ cảnh phim bạn xem' : 'Trợ lý hỏi đáp trực tuyến'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSessionList((v) => !v)}
                title="Lịch sử hội thoại"
                className={`rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-cinema-surface hover:text-slate-900 dark:text-slate-300 dark:hover:text-white ${
                  showSessionList ? 'bg-cinema-surface text-slate-900 dark:text-white' : ''
                }`}
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCreateNewSession}
                title="Tạo cuộc trò chuyện mới"
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-cinema-surface hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-cinema-surface hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Session History Switcher Panel */}
          {showSessionList ? (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Các phiên hội thoại ({sessions.length})
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  className="rounded-lg bg-cinema-red px-2.5 py-1 text-xs font-semibold text-white hover:bg-cinema-redHover"
                >
                  + Phiên mới
                </button>
              </div>
              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Bạn chưa có phiên hội thoại nào.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                        activeSessionId === s.id
                          ? 'border-cinema-red/60 bg-cinema-card text-slate-900 dark:text-white'
                          : 'border-cinema-border/60 bg-cinema-bg/50 text-slate-700 hover:bg-cinema-card dark:text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.session_title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {s.total_messages} tin nhắn
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="ml-2 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                        title="Xóa phiên"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages Body */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {/* Greeting bubble */}
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinema-card text-cinema-red">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl rounded-tl-sm border border-cinema-border bg-cinema-card px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                    {greeting}
                  </div>
                </div>

                {/* Quick Q&A chips when conversation is empty */}
                {messages.length === 0 && !loadingMessages && (
                  <div className="space-y-1.5 pl-9">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Câu hỏi nhanh:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="rounded-lg border border-cinema-border bg-cinema-bg px-2.5 py-1.5 text-left text-[11px] text-slate-700 transition-colors hover:border-cinema-red/60 hover:text-slate-900 dark:bg-cinema-bg/70 dark:text-slate-300 dark:hover:text-white"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loadingMessages && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.sender_type === 'USER';
                  const suggested = !isUser && Array.isArray(msg.suggestedMovies)
                    ? msg.suggestedMovies
                    : [];

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}
                    >
                      {!isUser && (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinema-card text-cinema-red">
                          <Bot className="h-4 w-4" />
                        </span>
                      )}

                      <div className={isUser ? 'max-w-[82%]' : 'min-w-0 max-w-[85%] space-y-2'}>
                        <div
                          className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isUser
                              ? 'rounded-tr-sm bg-cinema-red text-white'
                              : 'rounded-tl-sm border border-cinema-border bg-cinema-card text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isUser ? msg.message_text : renderFormattedBotText(msg.message_text)}
                        </div>

                        {/* Mini Suggested Movie Cards */}
                        {suggested.length > 0 && (
                          <div className="space-y-1.5">
                            {suggested.map((movie) => (
                              <div
                                key={movie.id || movie.slug}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleOpenSuggestedMovie(movie.slug)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenSuggestedMovie(movie.slug);
                                  }
                                }}
                                className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-cinema-border bg-cinema-bg/90 p-2 transition-all hover:border-cinema-red/70 hover:bg-cinema-card"
                              >
                                {movie.poster_url ? (
                                  <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    loading="lazy"
                                    className="h-14 w-10 shrink-0 rounded-lg border border-cinema-border/60 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg border border-cinema-border/60 bg-cinema-card text-slate-400">
                                    <Film className="h-4 w-4" />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-cinema-red dark:text-white">
                                    {movie.title}
                                  </p>
                                  {movie.release_year && (
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                      Năm {movie.release_year}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSuggestedMovie(movie.slug);
                                  }}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cinema-red px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-cinema-redHover"
                                >
                                  <Play className="h-3 w-3 fill-white" />
                                  Xem ngay
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sending && (
                  <div className="flex items-center gap-2 pl-9 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{botName} đang trả lời...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 border-t border-cinema-border bg-cinema-card/70 p-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={sending}
                  className="flex-1 rounded-xl border border-cinema-border bg-cinema-bg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-red text-white transition-colors hover:bg-cinema-redHover disabled:opacity-50"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button (Always visible on Client pages for Guests & Members) */}
      <button
        type="button"
        onClick={handleFloatingClick}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cinema-red text-white shadow-xl shadow-cinema-red/35 transition-transform hover:scale-105 hover:bg-cinema-redHover"
        aria-label={`Mở trợ lý ${botName}`}
        title={botName}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </>
  );
}
