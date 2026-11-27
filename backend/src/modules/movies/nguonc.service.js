import { AppError } from '../../utils/AppError.js';
import { slugify } from '../../utils/slugify.js';

const NGUONC_BASE_URL = 'https://phim.nguonc.com/api';
const KKPHIM_BASE_URL = 'https://phimapi.com';
const OPHIM_BASE_URL = 'https://ophim1.com';
const REQUEST_TIMEOUT_MS = 14_000;

export const SUPPORTED_PROVIDERS = ['NGUONC', 'KKPHIM', 'OPHIM'];

function normalizeProvider(raw) {
  const up = String(raw || 'NGUONC').trim().toUpperCase();
  if (up === 'KKPHIM' || up === 'PHIMAPI') return 'KKPHIM';
  if (up === 'OPHIM' || up === 'OPHIM1') return 'OPHIM';
  return 'NGUONC';
}

async function fetchJson(url, providerLabel = 'Nguồn Phim API') {
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CINEMATIC-Backend/1.0',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new AppError(
      502,
      'EXTERNAL_API_UNREACHABLE',
      `Không thể kết nối đến ${providerLabel} (${err?.name === 'TimeoutError' ? 'hết thời gian chờ' : 'lỗi mạng'}).`
    );
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new AppError(404, 'EXTERNAL_MOVIE_NOT_FOUND', `Không tìm thấy phim trên ${providerLabel}.`);
    }
    throw new AppError(
      502,
      'EXTERNAL_API_BAD_RESPONSE',
      `${providerLabel} trả về mã lỗi HTTP ${res.status}.`
    );
  }

  const data = await res.json().catch(() => null);
  if (!data || data.status === 'error' || data.status === false) {
    throw new AppError(
      404,
      'EXTERNAL_MOVIE_NOT_FOUND',
      `Không tìm thấy dữ liệu phim hợp lệ từ ${providerLabel}.`
    );
  }

  return data;
}

function cleanStr(v) {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function splitCommaNames(value) {
  if (!value) return [];
  const rawList = Array.isArray(value) ? value : String(value).split(',');
  const seen = new Set();
  const list = [];
  for (const raw of rawList) {
    const cleaned = String(raw || '').trim();
    if (!cleaned || cleaned.toLowerCase() === 'đang cập nhật') continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push(cleaned);
    }
  }
  return list;
}

function extractDurationMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/(\d+)/);
  if (!match) return null;
  const num = Number.parseInt(match[1], 10);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function extractCategoryGroup(categoryObj, preferredKey, groupNameKeyword) {
  if (!categoryObj || typeof categoryObj !== 'object') return [];
  const byKey = categoryObj[preferredKey];
  if (byKey && Array.isArray(byKey.list)) {
    return byKey.list.map((item) => item?.name?.trim()).filter(Boolean);
  }
  for (const entry of Object.values(categoryObj)) {
    const gName = String(entry?.group?.name || '').toLowerCase();
    if (gName.includes(groupNameKeyword) && Array.isArray(entry.list)) {
      return entry.list.map((item) => item?.name?.trim()).filter(Boolean);
    }
  }
  return [];
}

function resolveMovieStatus(currentEpisode, rawStatus = '') {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (s === 'completed') return 'COMPLETED';
  if (s === 'ongoing') return 'ONGOING';
  if (s === 'trailer') return 'UPCOMING';

  const text = String(currentEpisode || '').trim().toLowerCase();
  if (!text) return 'COMPLETED';
  if (text.includes('full') || text.includes('hoàn tất') || text.includes('hoan tat')) {
    return 'COMPLETED';
  }
  if (text.includes('trailer') || text.includes('sắp chiếu') || text.includes('sap chieu')) {
    return 'UPCOMING';
  }
  return 'ONGOING';
}

function parseEpisodeNumber(itemName, itemSlug, fallbackIndex) {
  const nameLower = String(itemName || '').trim().toLowerCase();
  const slugLower = String(itemSlug || '').trim().toLowerCase();
  if (nameLower === 'full' || slugLower === 'tap-full' || slugLower === 'full') {
    return 1;
  }
  const fromName = nameLower.match(/(\d+)/);
  if (fromName) {
    const n = Number.parseInt(fromName[1], 10);
    if (n > 0) return n;
  }
  const fromSlug = slugLower.match(/(\d+)/);
  if (fromSlug) {
    const n = Number.parseInt(fromSlug[1], 10);
    if (n > 0) return n;
  }
  return fallbackIndex;
}

function ensureFullImageUrl(url, baseDomain) {
  const trimmed = cleanStr(url);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const cleanBase = String(baseDomain || '').replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');
  return cleanBase ? `${cleanBase}/${cleanPath}` : trimmed;
}

// ---------- NGUONC NORMALIZER ----------
export function normalizeNguonCMovie(rawPayload) {
  const m = rawPayload?.movie || rawPayload;
  if (!m || !m.name) {
    throw new AppError(404, 'NGUONC_MOVIE_NOT_FOUND', 'Dữ liệu chi tiết phim từ NguonC không hợp lệ.');
  }

  const formatNames = extractCategoryGroup(m.category, '1', 'định dạng');
  const genreNames = extractCategoryGroup(m.category, '2', 'thể loại');
  const yearNames = extractCategoryGroup(m.category, '3', 'năm');
  const countryNames = extractCategoryGroup(m.category, '4', 'quốc gia');

  const isSeries =
    formatNames.some((n) => n.toLowerCase().includes('phim bộ')) || Number(m.total_episodes) > 1;
  const movieType = isSeries ? 'SERIES' : 'SINGLE';

  const categoryNames = [];
  if (formatNames.length > 0) {
    categoryNames.push(...formatNames);
  } else {
    categoryNames.push(movieType === 'SERIES' ? 'Phim bộ' : 'Phim lẻ');
  }
  if (
    genreNames.some((g) => slugify(g) === 'hoat-hinh') &&
    !categoryNames.some((c) => slugify(c) === 'hoat-hinh')
  ) {
    categoryNames.push('Hoạt hình');
  }

  const parsedYear =
    Number.isInteger(Number(m.year)) && Number(m.year) > 1900
      ? Number(m.year)
      : yearNames[0] && /^\d{4}$/.test(yearNames[0])
        ? Number.parseInt(yearNames[0], 10)
        : null;

  const thumbUrl = cleanStr(m.thumb_url) || cleanStr(m.thumb_url_webp);
  const posterUrl = cleanStr(m.poster_url) || cleanStr(m.poster_url_webp) || thumbUrl;
  const bannerUrl = posterUrl || thumbUrl;

  const durationMinutes = extractDurationMinutes(m.time);
  const quality = cleanStr(m.quality) || 'HD';

  const episodeMap = new Map();
  const usedNumbers = new Set();
  let sequenceCounter = 1;

  if (Array.isArray(m.episodes)) {
    for (const server of m.episodes) {
      const serverName = cleanStr(server?.server_name) || 'Server #1';
      if (!Array.isArray(server?.items)) continue;

      for (const item of server.items) {
        const embedUrl = cleanStr(item?.embed);
        const m3u8Url = cleanStr(item?.m3u8);
        if (!embedUrl && !m3u8Url) continue;

        const rawSlug = cleanStr(item?.slug) || `tap-${slugify(item?.name || String(sequenceCounter))}`;
        const normSlug = rawSlug.toLowerCase();

        if (!episodeMap.has(normSlug)) {
          let epNum = parseEpisodeNumber(item?.name, normSlug, sequenceCounter);
          while (usedNumbers.has(epNum)) epNum += 1;
          usedNumbers.add(epNum);
          sequenceCounter += 1;

          const displayName = cleanStr(item?.name) || String(epNum);
          const title =
            displayName.toLowerCase() === 'full'
              ? 'Full'
              : /^\d+$/.test(displayName)
                ? `Tập ${displayName}`
                : displayName;

          episodeMap.set(normSlug, {
            episode_number: epNum,
            title,
            slug: normSlug,
            duration_seconds: durationMinutes ? durationMinutes * 60 : null,
            sources: [],
          });
        }

        const epEntry = episodeMap.get(normSlug);
        if (embedUrl && !epEntry.sources.some((s) => s.video_url === embedUrl)) {
          epEntry.sources.push({
            source_name: serverName,
            video_url: embedUrl,
            quality,
            format_type: 'EMBED',
            is_default: epEntry.sources.length === 0,
          });
        }
        if (m3u8Url && !epEntry.sources.some((s) => s.video_url === m3u8Url)) {
          epEntry.sources.push({
            source_name: `${serverName} (HLS)`,
            video_url: m3u8Url,
            quality,
            format_type: 'HLS',
            is_default: epEntry.sources.length === 0,
          });
        }
      }
    }
  }

  const episodes = Array.from(episodeMap.values()).sort(
    (a, b) => a.episode_number - b.episode_number
  );

  return {
    api_id: cleanStr(m.id),
    external_source: 'NGUONC',
    name: cleanStr(m.name),
    origin_name: cleanStr(m.original_name),
    slug: cleanStr(m.slug) || slugify(m.name),
    description: cleanStr(m.description),
    poster_url: posterUrl,
    thumbnail_url: thumbUrl || posterUrl,
    banner_url: bannerUrl,
    release_year: parsedYear,
    type: movieType,
    access_type: 'FREE',
    movie_status: resolveMovieStatus(m.current_episode),
    duration_minutes: durationMinutes,
    total_episodes:
      Number.isInteger(Number(m.total_episodes)) && Number(m.total_episodes) > 0
        ? Number(m.total_episodes)
        : Math.max(1, episodes.length),
    current_episode_info: cleanStr(m.current_episode),
    quality,
    language: cleanStr(m.language),
    tmdb_id: m.tmdb?.id ? Number(m.tmdb.id) : null,
    imdb_id: cleanStr(m.imdb?.id),
    genre_names: genreNames,
    country_names: countryNames,
    category_names: categoryNames,
    director_names: splitCommaNames(m.director),
    actor_names: splitCommaNames(m.casts),
    episodes,
  };
}

// ---------- KKPHIM & OPHIM NORMALIZER ----------
export function normalizeKKOrOPhimMovie(rawPayload, provider = 'KKPHIM') {
  const m = rawPayload?.movie || rawPayload?.data?.item || rawPayload;
  const rawEpisodes = rawPayload?.episodes || rawPayload?.data?.item?.episodes || [];
  if (!m || !m.name) {
    throw new AppError(404, 'EXTERNAL_MOVIE_NOT_FOUND', `Dữ liệu chi tiết phim từ ${provider} không hợp lệ.`);
  }

  const imgBase =
    provider === 'OPHIM' ? 'https://img.ophim.live/uploads/movies' : 'https://phimimg.com';

  // In KKPhim/OPhim: poster_url is vertical (or thumb_url is vertical depending on provider); keep both cleanly
  const rawPoster = ensureFullImageUrl(m.poster_url, imgBase);
  const rawThumb = ensureFullImageUrl(m.thumb_url, imgBase);
  const thumbnailUrl = rawPoster || rawThumb;
  const bannerUrl = rawThumb || rawPoster;

  const genreNames = Array.isArray(m.category)
    ? m.category.map((g) => cleanStr(g?.name)).filter(Boolean)
    : [];
  const countryNames = Array.isArray(m.country)
    ? m.country.map((c) => cleanStr(c?.name)).filter(Boolean)
    : [];

  const rawType = String(m.type || '').toLowerCase();
  const parsedTotal = Number.parseInt(String(m.episode_total || '').replace(/\D+/g, ''), 10);
  const isSeries = rawType === 'series' || rawType === 'tvshows' || (parsedTotal > 1);
  const movieType = isSeries ? 'SERIES' : 'SINGLE';

  const categoryNames = [movieType === 'SERIES' ? 'Phim bộ' : 'Phim lẻ'];
  if (rawType === 'hoathinh' || genreNames.some((g) => slugify(g) === 'hoat-hinh')) {
    categoryNames.push('Hoạt hình');
  }
  if (rawType === 'tvshows') {
    categoryNames.push('TV Shows');
  }
  if (m.chieurap) {
    categoryNames.push('Phim chiếu rạp');
  }

  const durationMinutes = extractDurationMinutes(m.time);
  const quality = cleanStr(m.quality) || 'HD';
  const parsedYear = Number.isInteger(Number(m.year)) && Number(m.year) > 1900 ? Number(m.year) : null;

  const episodeMap = new Map();
  const usedNumbers = new Set();
  let sequenceCounter = 1;

  if (Array.isArray(rawEpisodes)) {
    for (const server of rawEpisodes) {
      const serverName = cleanStr(server?.server_name) || 'Server #1';
      const epList = Array.isArray(server?.server_data) ? server.server_data : [];

      for (const item of epList) {
        const embedUrl = cleanStr(item?.link_embed);
        const m3u8Url = cleanStr(item?.link_m3u8);
        if (!embedUrl && !m3u8Url) continue;

        const rawSlug = cleanStr(item?.slug) || `tap-${slugify(item?.name || String(sequenceCounter))}`;
        const normSlug = rawSlug.toLowerCase();

        if (!episodeMap.has(normSlug)) {
          let epNum = parseEpisodeNumber(item?.name, normSlug, sequenceCounter);
          while (usedNumbers.has(epNum)) epNum += 1;
          usedNumbers.add(epNum);
          sequenceCounter += 1;

          const displayName = cleanStr(item?.name) || String(epNum);
          const title =
            displayName.toLowerCase() === 'full'
              ? 'Full'
              : /^\d+$/.test(displayName)
                ? `Tập ${displayName}`
                : displayName;

          episodeMap.set(normSlug, {
            episode_number: epNum,
            title,
            slug: normSlug,
            duration_seconds: durationMinutes ? durationMinutes * 60 : null,
            sources: [],
          });
        }

        const epEntry = episodeMap.get(normSlug);
        if (embedUrl && !epEntry.sources.some((s) => s.video_url === embedUrl)) {
          epEntry.sources.push({
            source_name: serverName,
            video_url: embedUrl,
            quality,
            format_type: 'EMBED',
            is_default: epEntry.sources.length === 0,
          });
        }
        if (m3u8Url && !epEntry.sources.some((s) => s.video_url === m3u8Url)) {
          epEntry.sources.push({
            source_name: `${serverName} (HLS)`,
            video_url: m3u8Url,
            quality,
            format_type: 'HLS',
            is_default: epEntry.sources.length === 0,
          });
        }
      }
    }
  }

  const episodes = Array.from(episodeMap.values()).sort(
    (a, b) => a.episode_number - b.episode_number
  );

  return {
    api_id: cleanStr(m._id) || cleanStr(m.id),
    external_source: provider,
    name: cleanStr(m.name),
    origin_name: cleanStr(m.origin_name),
    slug: cleanStr(m.slug) || slugify(m.name),
    description: cleanStr(m.content) || cleanStr(m.description),
    poster_url: bannerUrl,
    thumbnail_url: thumbnailUrl,
    banner_url: bannerUrl,
    release_year: parsedYear,
    type: movieType,
    access_type: 'FREE',
    movie_status: resolveMovieStatus(m.episode_current, m.status),
    duration_minutes: durationMinutes,
    total_episodes: parsedTotal > 0 ? parsedTotal : Math.max(1, episodes.length),
    current_episode_info: cleanStr(m.episode_current),
    quality,
    language: cleanStr(m.lang),
    tmdb_id: m.tmdb?.id ? Number(m.tmdb.id) || null : null,
    imdb_id: cleanStr(m.imdb?.id),
    genre_names: genreNames,
    country_names: countryNames,
    category_names: Array.from(new Set(categoryNames)),
    director_names: splitCommaNames(m.director),
    actor_names: splitCommaNames(m.actor),
    episodes,
  };
}

// ---------- MULTI-PROVIDER SEARCH ----------
export async function searchNguonC(keyword, page = 1, rawProvider = 'NGUONC') {
  const provider = normalizeProvider(rawProvider);
  const trimmed = String(keyword || '').trim();
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);

  if (provider === 'KKPHIM') {
    const url = trimmed
      ? `${KKPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(trimmed)}&limit=12&page=${safePage}`
      : `${KKPHIM_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${safePage}`;
    const data = await fetchJson(url, 'KKPhim API');
    const rawItems = data?.data?.items || data?.items || [];
    const imgDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com';

    return {
      provider: 'KKPHIM',
      items: rawItems.map((item) => ({
        provider: 'KKPHIM',
        name: item.name,
        origin_name: item.origin_name || null,
        slug: item.slug,
        thumb_url: ensureFullImageUrl(item.poster_url || item.thumb_url, imgDomain),
        poster_url: ensureFullImageUrl(item.thumb_url || item.poster_url, imgDomain),
        current_episode: item.episode_current || null,
        quality: item.quality || 'HD',
        language: item.lang || null,
        year: item.year || null,
      })),
    };
  }

  if (provider === 'OPHIM') {
    const url = trimmed
      ? `${OPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(trimmed)}&page=${safePage}`
      : `${OPHIM_BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${safePage}`;
    const data = await fetchJson(url, 'OPhim API');
    const rawItems = data?.data?.items || data?.items || [];
    const imgDomain = data?.data?.APP_DOMAIN_CDN_IMAGE
      ? `${data.data.APP_DOMAIN_CDN_IMAGE}/uploads/movies`
      : data?.pathImage || 'https://img.ophim.live/uploads/movies';

    return {
      provider: 'OPHIM',
      items: rawItems.map((item) => ({
        provider: 'OPHIM',
        name: item.name,
        origin_name: item.origin_name || null,
        slug: item.slug,
        thumb_url: ensureFullImageUrl(item.thumb_url || item.poster_url, imgDomain),
        poster_url: ensureFullImageUrl(item.poster_url || item.thumb_url, imgDomain),
        current_episode: item.episode_current || null,
        quality: item.quality || 'HD',
        language: item.lang || null,
        year: item.year || null,
      })),
    };
  }

  // Default: NGUONC
  const url = trimmed
    ? `${NGUONC_BASE_URL}/films/search?keyword=${encodeURIComponent(trimmed)}&page=${safePage}`
    : `${NGUONC_BASE_URL}/films/phim-moi-cap-nhat?page=${safePage}`;

  const data = await fetchJson(url, 'NguonC API');
  const items = Array.isArray(data.items)
    ? data.items.map((item) => ({
        provider: 'NGUONC',
        name: item.name,
        origin_name: item.original_name || null,
        slug: item.slug,
        thumb_url: item.thumb_url || item.poster_url || null,
        poster_url: item.poster_url || item.thumb_url || null,
        current_episode: item.current_episode || null,
        quality: item.quality || null,
        language: item.language || null,
        modified: item.modified || null,
      }))
    : [];

  return {
    provider: 'NGUONC',
    items,
    paginate: data.paginate || null,
  };
}

// ---------- MULTI-PROVIDER PREVIEW BY SLUG ----------
export async function fetchNguonCPreview(slugOrId, rawProvider = 'NGUONC') {
  const provider = normalizeProvider(rawProvider);
  const target = String(slugOrId || '').trim();
  if (!target) {
    throw new AppError(400, 'INVALID_SLUG', 'Vui lòng nhập slug hoặc ID phim cần tra cứu.');
  }

  if (provider === 'KKPHIM') {
    const raw = await fetchJson(`${KKPHIM_BASE_URL}/phim/${encodeURIComponent(target)}`, 'KKPhim API');
    return normalizeKKOrOPhimMovie(raw, 'KKPHIM');
  }

  if (provider === 'OPHIM') {
    const raw = await fetchJson(`${OPHIM_BASE_URL}/phim/${encodeURIComponent(target)}`, 'OPhim API');
    return normalizeKKOrOPhimMovie(raw, 'OPHIM');
  }

  const raw = await fetchJson(`${NGUONC_BASE_URL}/film/${encodeURIComponent(target)}`, 'NguonC API');
  return normalizeNguonCMovie(raw);
}

// ---------- DIRECT LINK URL PARSER & PREVIEW ----------
export function parseMovieSourceUrl(rawUrl, fallbackProvider = 'NGUONC') {
  const input = String(rawUrl || '').trim();
  if (!input) {
    throw new AppError(400, 'INVALID_URL', 'Vui lòng dán đường dẫn (Link URL) phim cần nhập.');
  }

  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new AppError(400, 'INVALID_URL', 'Đường dẫn không đúng định dạng URL (cần bắt đầu bằng https://...).');
  }

  const host = parsed.hostname.toLowerCase();
  let provider = normalizeProvider(fallbackProvider);
  if (host.includes('nguonc')) {
    provider = 'NGUONC';
  } else if (host.includes('phimapi') || host.includes('kkphim')) {
    provider = 'KKPHIM';
  } else if (host.includes('ophim')) {
    provider = 'OPHIM';
  }

  const segments = parsed.pathname
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    throw new AppError(400, 'INVALID_URL', 'Không tìm thấy slug phim trong đường dẫn URL.');
  }

  // Extract slug after /phim/<slug> or /film/<slug> or last segment
  let slug = segments[segments.length - 1];
  const phimIdx = segments.findIndex((s) => s === 'phim' || s === 'film');
  if (phimIdx >= 0 && segments[phimIdx + 1]) {
    slug = segments[phimIdx + 1];
  }
  slug = decodeURIComponent(slug).replace(/\.html?$/i, '').trim();

  if (!slug) {
    throw new AppError(400, 'INVALID_URL', 'Không thể tách được slug phim từ URL đã nhập.');
  }

  return { provider, slug };
}

export async function fetchPreviewByUrl(rawUrl, fallbackProvider = 'NGUONC') {
  const { provider, slug } = parseMovieSourceUrl(rawUrl, fallbackProvider);
  const preview = await fetchNguonCPreview(slug, provider);
  return {
    ...preview,
    detected_provider: provider,
    detected_slug: slug,
  };
}
