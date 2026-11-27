import * as repo from './chatbot.repository.js';

const MOOD_RULES = [
  {
    id: 'comfort_fun',
    label: 'đang buồn / chán / mệt mỏi / muốn giải trí nhẹ nhàng',
    empathyNeeded: true,
    triggers: [
      'buon',
      'chan',
      'stress',
      'met',
      'vui',
      'cuoi',
      'xa stress',
      'giai tri',
      'thu gian',
      'ap luc',
      'tuot mood',
      'giai sau',
    ],
    genres: ['Hài hước', 'Hài', 'Hoạt hình', 'Gia đình'],
  },
  {
    id: 'romance_gentle',
    label: 'cô đơn / muốn xem phim lãng mạn, ngọt ngào, nhẹ nhàng',
    empathyNeeded: true,
    triggers: [
      'co don',
      'yeu',
      'lang man',
      'ngot ngao',
      'nhe nhang',
      'that tinh',
      'cam dong',
      'tam trang',
      'tinh yeu',
      'chua lanh',
    ],
    genres: ['Tình cảm', 'Lãng mạn', 'Tâm lý'],
  },
  {
    id: 'thrill_action',
    label: 'muốn xem phim kịch tính, căng thẳng, hồi hộp, mạnh mẽ',
    empathyNeeded: false,
    triggers: [
      'kich tinh',
      'cang thang',
      'hoi hop',
      'manh me',
      'kich thich',
      'gay can',
      'man nhan',
      'rung ron',
      'so hai',
      'pha an',
    ],
    genres: ['Hành động', 'Trinh thám', 'Kinh dị', 'Hình sự', 'Gây cấn'],
  },
  {
    id: 'curious_scifi',
    label: 'tò mò / thích hack não, khám phá tương lai, bí ẩn',
    empathyNeeded: false,
    triggers: [
      'to mo',
      'hack nao',
      'tuong lai',
      'vu tru',
      'ky ao',
      'phep thuat',
      'sieu nhien',
      'xoan nao',
    ],
    genres: ['Khoa học viễn tưởng', 'Bí ẩn', 'Phiêu lưu'],
  },
];

const EMOTION_TRIGGERS = [
  'buon',
  'chan',
  'stress',
  'met',
  'co don',
  'ap luc',
  'that tinh',
  'tuot mood',
  'nan',
  'kiet suc',
  'tam trang',
];

const PREMIUM_TRIGGERS = [
  'premium',
  'vip',
  'goi cuoc',
  'goi thang',
  'goi nam',
  'goi xem phim',
  'goi thanh vien',
  'cac goi',
  'mua goi',
  'dang ky goi',
  'bang gia',
  'gia bao nhieu',
  'bao nhieu tien',
  'nang cap',
  'thanh toan',
  'chuyen khoan',
  'zalopay',
  'momo',
  'gia han',
  'hoan tien',
];

const STOP_WORDS = new Set([
  'cho',
  'toi',
  'minh',
  'em',
  'anh',
  'chi',
  'ban',
  'xin',
  'goi',
  'y',
  'tim',
  'phim',
  'bo',
  'le',
  'tap',
  'xem',
  'gi',
  'nao',
  'hay',
  'nhat',
  'moi',
  'co',
  'khong',
  'ko',
  'k',
  'la',
  've',
  'cua',
  'voi',
  'va',
  'hoac',
  'nhung',
  'nay',
  'kia',
  'do',
  'nay',
  'di',
  'nhe',
  'nha',
  'nhi',
  'a',
  'oi',
  'hom',
  'nay',
  'dang',
  'rat',
  'qua',
  'hoi',
  'muon',
  'can',
  'duoc',
  'khac',
  'the',
  'loai',
  'web',
  'trang',
  'cinematic',
  'bao',
  'nhieu',
  'tien',
  'gia',
  'premium',
  'nang',
  'cap',
  'thanh',
  'toan',
  'nho',
  'giup',
  'tu',
  'van',
  'de',
  'xuat',
  'mot',
  'vai',
  'so',
  'tren',
  'day',
  'luon',
  'nua',
  'tai',
  'sao',
  'nhu',
  'nao',
  'cam',
  'thay',
  'nguoi',
  'chao',
  'hello',
  'hi',
  'alo',
  'buon',
  'chan',
  'stress',
  'met',
  'moi',
  'vui',
  'cuoi',
  'xa',
  'giai',
  'tri',
  'thu',
  'gian',
  'co',
  'don',
  'do',
  'ben',
  'vay',
  'sao',
  'giup',
  'cho',
]);

function normalizeAscii(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(asciiText, phrase) {
  const cleanPhrase = normalizeAscii(phrase);
  if (!cleanPhrase) return false;
  const escaped = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i').test(asciiText);
}

function formatVnd(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
}

function truncateText(text, maxLen = 150) {
  const clean = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'Chưa có mô tả ngắn.';
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen).trim()}...`;
}

function extractSearchKeywords(rawMessage) {
  const cleanedRaw = String(rawMessage || '')
    .replace(/[?!.,;:"'()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanedRaw.split(' ').filter(Boolean);
  const meaningful = [];
  for (const w of words) {
    const norm = normalizeAscii(w);
    if (norm.length >= 2 && !STOP_WORDS.has(norm)) {
      meaningful.push(w);
    }
  }

  const phrases = [];
  // Keep multi-word contiguous meaningful phrase first (e.g. "Harry Potter", "Attack on Titan")
  if (meaningful.length >= 2 && meaningful.length <= 5) {
    phrases.push(meaningful.join(' '));
  }
  // Also include individual meaningful tokens (length >= 3 to avoid noisy short matches)
  for (const token of meaningful) {
    if (normalizeAscii(token).length >= 3 && !phrases.includes(token)) {
      phrases.push(token);
    }
  }

  return phrases.slice(0, 6);
}

function formatMovieForPrompt(m) {
  const year = m.release_year ? ` (${m.release_year})` : '';
  const origin = m.origin_name && m.origin_name !== m.name ? ` / ${m.origin_name}` : '';
  const genres = m.genres || 'Đang cập nhật';
  const access = m.access_type === 'PREMIUM' ? 'Premium' : 'Miễn phí';
  const typeLabel = m.type === 'SERIES' ? 'Phim bộ' : 'Phim lẻ';
  const extraCast = [
    m.directors ? `Đạo diễn: ${m.directors}` : '',
    m.actors ? `Diễn viên: ${m.actors.split(', ').slice(0, 4).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return `- ${m.name}${origin}${year} | ${typeLabel} | ${access} | Thể loại: ${genres}${extraCast ? ` | ${extraCast}` : ''} | Slug: /movies/${m.slug} | Mô tả: ${truncateText(m.description, 150)}`;
}

function formatPlansForPrompt(plans) {
  if (!plans || plans.length === 0) return '';
  return plans
    .map((p) => {
      const popular = p.is_popular ? ' (Phổ biến nhất)' : '';
      return `- ${p.name}${popular}: ${formatVnd(p.price)} / ${p.duration_days} ngày`;
    })
    .join('\n');
}

/**
 * Match movies actually mentioned in the AI's reply against the real MySQL candidates
 * queried in this turn, preserving the order of appearance (max 4 items).
 */
export function extractSuggestedMoviesFromReply(
  replyText,
  candidateMovies = [],
  currentMovieId = null,
  maxCount = 4
) {
  const rawReply = String(replyText || '').toLowerCase();
  const asciiReply = normalizeAscii(replyText);
  if (!rawReply || !Array.isArray(candidateMovies) || candidateMovies.length === 0) {
    return [];
  }

  const hits = [];
  const seenIds = new Set();

  for (const movie of candidateMovies) {
    if (!movie || !movie.id || !movie.slug || seenIds.has(movie.id)) continue;

    const namesToCheck = [movie.name];
    if (movie.origin_name) {
      for (const part of String(movie.origin_name).split(/[,/|]/)) {
        const trimmed = part.trim();
        if (trimmed.length >= 4) namesToCheck.push(trimmed);
      }
    }

    let firstPos = -1;
    for (const candidateName of namesToCheck) {
      const lowerName = String(candidateName || '').trim().toLowerCase();
      if (lowerName.length < 3) continue;
      let idx = rawReply.indexOf(lowerName);
      if (idx === -1) {
        const asciiName = normalizeAscii(candidateName);
        if (asciiName.length >= 4) {
          idx = asciiReply.indexOf(asciiName);
        }
      }
      if (idx !== -1 && (firstPos === -1 || idx < firstPos)) {
        firstPos = idx;
      }
    }

    if (firstPos !== -1) {
      seenIds.add(movie.id);
      hits.push({ pos: firstPos, movie });
    }
  }

  hits.sort((a, b) => a.pos - b.pos);

  // Exclude the movie the user is already watching if at least 1 other movie is recommended
  const nonCurrentHits = currentMovieId
    ? hits.filter((h) => h.movie.id !== currentMovieId)
    : hits;
  const finalHits = nonCurrentHits.length > 0 ? nonCurrentHits : hits;

  return finalHits.slice(0, maxCount).map(({ movie }) => ({
    id: movie.id,
    title: movie.name,
    slug: movie.slug,
    poster_url: movie.thumbnail_url || movie.poster_url || '',
    release_year: movie.release_year || null,
  }));
}

/**
 * Analyze user message + current movie context, fetch real matching movies
 * (current movie + similar movies + keyword + mood mapping + fallback)
 * and on-demand Premium plans from MySQL, then construct a grounded system prompt.
 */
export async function buildGroundedChatbotPrompt({
  userMessage,
  baseSystemPrompt,
  currentMovieSlug = null,
}) {
  const asciiMsg = normalizeAscii(userMessage);

  // 0. Resolve current movie & similar movies if user is viewing a movie/watch page
  let currentMovie = null;
  let similarMovies = [];
  if (currentMovieSlug && String(currentMovieSlug).trim()) {
    currentMovie = await repo.findMovieBySlugForRag(currentMovieSlug);
    if (currentMovie) {
      similarMovies = await repo.findSimilarMoviesByMovieIdForRag(currentMovie.id, 6);
    }
  }

  // 1. Detect explicit genres in DB that appear in the user's message
  const allDbGenres = await repo.listActiveGenresForRag();
  const explicitGenres = [];
  for (const g of allDbGenres) {
    if (containsPhrase(asciiMsg, g.name)) {
      explicitGenres.push(g.name);
    }
  }

  // 2. Detect mood rules -> mapped genres
  const matchedMoods = [];
  const moodGenresSet = new Set();
  for (const rule of MOOD_RULES) {
    if (rule.triggers.some((trig) => containsPhrase(asciiMsg, trig))) {
      matchedMoods.push(rule);
      for (const gName of rule.genres) {
        moodGenresSet.add(gName);
      }
    }
  }
  const moodGenres = Array.from(moodGenresSet);
  const hasEmotion = EMOTION_TRIGGERS.some((t) => containsPhrase(asciiMsg, t));

  // 3. Detect if user is asking about Premium / pricing / payment (avoid confusing "gợi ý" with "gói")
  const rawLower = String(userMessage || '').toLowerCase();
  const asksAboutPremium =
    /(^|\s)gói(\s|$|[?!.,])/i.test(rawLower) ||
    PREMIUM_TRIGGERS.some((t) => containsPhrase(asciiMsg, t));

  // 4. Retrieve real movies from MySQL (keywords + explicit genres; mood genres only when no explicit genre specified)
  const keywords = extractSearchKeywords(userMessage);
  const targetGenres = explicitGenres.length > 0 ? explicitGenres : moodGenres;

  const [keywordMovies, genreMovies, premiumPlans] = await Promise.all([
    keywords.length > 0 ? repo.searchMoviesByKeywordsForRag(keywords, 8) : Promise.resolve([]),
    targetGenres.length > 0 ? repo.findMoviesByGenresForRag(targetGenres, 8) : Promise.resolve([]),
    asksAboutPremium ? repo.listActivePremiumPlansForRag() : Promise.resolve([]),
  ]);

  // Prioritize exact genre hits when user asked an explicit genre; otherwise prioritize mood genre hits when mood detected
  const mergedMap = new Map();
  if (explicitGenres.length > 0) {
    for (const m of genreMovies) {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    }
  } else if (moodGenres.length > 0) {
    for (const m of genreMovies) {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    }
    for (const m of keywordMovies) {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    }
  } else {
    for (const m of keywordMovies) {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    }
    for (const m of genreMovies) {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    }
  }
  let selectedMovies = Array.from(mergedMap.values()).slice(0, 8);
  const directMatchCount = selectedMovies.length;

  // 5. Fallback / top-up so AI ALWAYS has at least 5-6 real movies in context
  let catalogNote = '';
  const requestedSpecificGenres = explicitGenres.length > 0 || moodGenres.length > 0;

  if (selectedMovies.length < 3) {
    const fallbackMovies = await repo.findFallbackFeaturedMoviesForRag(8);
    const existingIds = new Set(selectedMovies.map((m) => m.id));
    if (currentMovie?.id) existingIds.add(currentMovie.id);

    for (const fm of fallbackMovies) {
      if (selectedMovies.length >= 6) break;
      if (!existingIds.has(fm.id)) {
        existingIds.add(fm.id);
        selectedMovies.push(fm);
      }
    }
  }

  if (directMatchCount === 0) {
    if (requestedSpecificGenres) {
      const wantedLabel =
        explicitGenres.length > 0 ? explicitGenres.join(', ') : moodGenres.join(', ');
      catalogNote = `LƯU Ý KHO PHIM: Kho phim CINEMATIC hiện CHƯA có phim nào thuộc nhóm thể loại (${wantedLabel}). Hãy nói thẳng thắn, lịch sự rằng website hiện chưa có phim thể loại đó, rồi gợi ý 2-3 bộ phim nổi bật khác trong danh sách thật bên dưới.`;
    } else if (keywords.length > 0 && !currentMovie) {
      catalogNote =
        'LƯU Ý KHO PHIM: Không tìm thấy phim khớp chính xác tên/từ khóa khách nhắc. Hãy báo thẳng thắn là CINEMATIC hiện chưa có phim đó, rồi gợi ý 2-3 bộ phim thật nổi bật đang sẵn có trong danh sách bên dưới.';
    } else {
      catalogNote = 'Danh sách các phim nổi bật và mới nhất hiện có trên CINEMATIC:';
    }
  } else if (directMatchCount < 3) {
    catalogNote =
      'Danh sách phim THẬT trên CINEMATIC (gồm phim gần khớp và phim nổi bật bổ sung). Nếu đúng tên phim khách hỏi KHÔNG xuất hiện trong danh sách bên dưới, hãy nói rõ là web chưa có phim đó rồi gợi ý 2-3 phim thật từ danh sách này:';
  } else {
    catalogNote =
      'Danh sách phim THẬT đang có sẵn trên CINEMATIC khớp với yêu cầu/tâm trạng của người dùng:';
  }

  // 6. Compose tightened System Prompt + Grounded Real Data
  const moodContextLine =
    matchedMoods.length > 0 || hasEmotion
      ? `- Ngữ cảnh tâm trạng phát hiện được: Người dùng đang ${
          matchedMoods.map((m) => m.label).join('; ') || 'chia sẻ cảm xúc cá nhân'
        }. Hãy mở đầu bằng 1 câu đồng cảm/động viên ấm áp, tự nhiên trước khi gợi ý phim.`
      : '';

  const currentMovieBlock = currentMovie
    ? [
        '[PHIM NGƯỜI DÙNG ĐANG XEM HIỆN TẠI]',
        formatMovieForPrompt(currentMovie),
        similarMovies.length > 0
          ? `[PHIM TƯƠNG TỰ CÙNG THỂ LOẠI TRÊN CINEMATIC (loại trừ phim đang xem)]\n${similarMovies.map(formatMovieForPrompt).join('\n')}`
          : '[PHIM TƯƠNG TỰ CÙNG THỂ LOẠI TRÊN CINEMATIC]\n(Chưa có phim khác trùng thể loại trực tiếp, hãy gợi ý từ danh sách phim nổi bật bên dưới.)',
      ].join('\n')
    : '';

  const currentMovieRule = currentMovie
    ? `7. NGỮ CẢNH PHIM ĐANG XEM: Người dùng hiện đang xem phim "${currentMovie.name}". Khi họ nhắc "phim này", "bộ này" hoặc xin gợi ý phim tương tự, hãy hiểu là họ đang nói về "${currentMovie.name}" và chọn 2-3 bộ phim từ mục [PHIM TƯƠNG TỰ CÙNG THỂ LOẠI TRÊN CINEMATIC] (không bịa phim ngoài).`
    : '';

  const moviesBlock =
    selectedMovies.length > 0
      ? selectedMovies.map(formatMovieForPrompt).join('\n')
      : '(Hiện chưa có phim nào được xuất bản trong hệ thống.)';

  const premiumBlock =
    asksAboutPremium && premiumPlans.length > 0
      ? `\n[THÔNG TIN GÓI PREMIUM THẬT TRÊN CINEMATIC (chỉ dùng vì khách đang hỏi)]\n${formatPlansForPrompt(premiumPlans)}\nQuyền lợi chung: Xem toàn bộ phim gắn nhãn Premium, chất lượng cao sắc nét, không quảng cáo, thanh toán QR nhanh chóng trên website.`
      : '';

  const strictRules = [
    '=== QUY TẮC BẮT BUỘC CỦA CINEMATIC AI ===',
    '1. GIỌNG ĐIỆU & ĐỒNG CẢM: Trả lời bằng tiếng Việt thân thiện, tự nhiên, gần gũi. Nếu người dùng bày tỏ cảm xúc (buồn, chán, mệt, stress, cô đơn...), luôn mở đầu bằng 1 câu đồng cảm/động viên ngắn gọn, ấm áp rồi mới gợi ý 2-3 phim phù hợp nhất kèm 1 câu lý do ngắn cho từng phim.',
    '2. TUYỆT ĐỐI KHÔNG BỊA PHIM & VIẾT ĐÚNG TÊN PHIM: Chỉ được gợi ý hoặc giới thiệu các bộ phim có tên trong dữ liệu thật bên dưới và PHẢI viết CHÍNH XÁC tên phim như trong danh sách cung cấp. KHÔNG tự nghĩ ra phim ngoài danh sách. Nếu kho phim chưa có đúng phim/thể loại khách tìm, hãy trả lời thẳng thắn là web chưa có và gợi ý sang 2-3 phim thật đang có sẵn.',
    '3. CẤM CHỮ GIỮ CHỖ (PLACEHOLDER): CẤM TUYỆT ĐỐI viết các cụm chữ giữ chỗ như "[Tên phim...]", "[Tên phim khác trong danh sách nếu có]", "(nếu có)", "...", hay tên phim mẫu. Chỉ liệt kê đúng tên các bộ phim THẬT đang có trong danh sách hệ thống cung cấp; nếu danh sách chỉ có ít hơn 3 phim thì chỉ liệt kê đúng số phim thực tế có sẵn.',
    '4. ĐỊNH DẠNG GỌN ĐẸP CHO KHUNG CHAT NHỎ: CẤM dùng bảng Markdown (|---|), CẤM dùng tiêu đề lớn (#, ##, ###). Trả lời súc tích (khoảng 3-6 dòng), dùng gạch đầu dòng (-) đơn giản, dễ đọc.',
    '5. KHÔNG SPAM & KHÔNG BỊA TÍNH NĂNG: KHÔNG tự ý nhắc giá, quảng cáo hay chèo kéo mua gói Premium nếu khách không hỏi về gói/giá/nâng cấp. Tuyệt đối KHÔNG bịa các tính năng website không có (như tải phim offline, xem trước ngày công chiếu, xem chung...).',
    '6. GIỚI HẠN NỘI DUNG TỪNG CẢNH: Nếu người dùng hỏi chi tiết một cảnh, mốc thời gian hoặc diễn biến cụ thể trong từng tập phim, hãy trả lời thẳng là bạn chỉ có thông tin tổng quan về phim chứ không thể xem trực tiếp nội dung từng cảnh, tuyệt đối không tự suy đoán.',
    currentMovieRule,
    moodContextLine,
  ]
    .filter(Boolean)
    .join('\n');

  const finalSystemPrompt = [
    baseSystemPrompt ? baseSystemPrompt.trim() : 'Bạn là trợ lý hỏi đáp thân thiện của website xem phim trực tuyến CINEMATIC.',
    '',
    strictRules,
    '',
    currentMovieBlock,
    '[DỮ LIỆU KHO PHIM THẬT TỪ CINEMATIC]',
    catalogNote,
    moviesBlock,
    premiumBlock,
  ]
    .filter((section) => section !== '')
    .join('\n');

  // Collect deduplicated candidate pool for matching suggestedMovies from AI reply
  const candidateMap = new Map();
  for (const m of [...similarMovies, ...selectedMovies, ...(currentMovie ? [currentMovie] : [])]) {
    if (m && m.id && !candidateMap.has(m.id)) {
      candidateMap.set(m.id, m);
    }
  }

  return {
    systemPrompt: finalSystemPrompt,
    candidateMovies: Array.from(candidateMap.values()),
    currentMovie,
    meta: {
      currentMovieName: currentMovie?.name || null,
      similarMoviesCount: similarMovies.length,
      matchedMoviesCount: selectedMovies.length,
      explicitGenres,
      moodGenres,
      asksAboutPremium,
      hasEmotion,
    },
  };
}

