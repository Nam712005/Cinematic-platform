import { ArrowUpDown, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moviesApi } from '../../api/moviesApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import MovieCard from '../../components/common/MovieCard.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { MovieGridSkeleton } from '../../components/common/Skeleton.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới cập nhật' },
  { value: 'most_viewed', label: 'Xem nhiều nhất' },
  { value: 'top_rated', label: 'Đánh giá cao nhất' },
  { value: 'year_desc', label: 'Năm mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
];

const UNIFIED_FORMAT_OPTIONS = [
  { value: '', label: 'Tất cả định dạng' },
  { value: 'type:SINGLE', label: 'Phim lẻ' },
  { value: 'type:SERIES', label: 'Phim bộ' },
  { value: 'category:phim-chieu-rap', label: 'Phim chiếu rạp' },
  { value: 'category:hoat-hinh', label: 'Hoạt hình' },
  { value: 'category:tv-shows', label: 'TV Shows' },
];

const ACCESS_OPTIONS = [
  { value: '', label: 'Tất cả loại phim' },
  { value: 'FREE', label: 'Miễn phí' },
  { value: 'PREMIUM', label: 'Premium' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'ONGOING', label: 'Đang chiếu' },
  { value: 'UPCOMING', label: 'Sắp chiếu' },
];

export default function SearchPage() {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [taxonomy, setTaxonomy] = useState({
    genres: [],
    countries: [],
    categories: [],
    years: [],
  });
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Extract current filters from URL
  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || searchParams.get('search') || '',
      genre: searchParams.get('genre') || '',
      country: searchParams.get('country') || '',
      category: searchParams.get('category') || '',
      year: searchParams.get('year') || '',
      movie_status: searchParams.get('movie_status') || '',
      type: searchParams.get('type') || '',
      access_type: searchParams.get('access_type') || '',
      sort: searchParams.get('sort') || 'newest',
      page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
    }),
    [searchParams]
  );

  // Resolve unified format select value from type / category params
  const unifiedFormatValue = useMemo(() => {
    if (filters.type === 'SINGLE') return 'type:SINGLE';
    if (filters.type === 'SERIES') return 'type:SERIES';
    if (filters.category) {
      if (filters.category === 'phim-le') return 'type:SINGLE';
      if (filters.category === 'phim-bo') return 'type:SERIES';
      return `category:${filters.category}`;
    }
    return '';
  }, [filters.type, filters.category]);

  // Load filter options from backend
  useEffect(() => {
    let active = true;
    moviesApi
      .getTaxonomyAll()
      .then((res) => {
        if (active && res?.data) {
          setTaxonomy({
            genres: res.data.genres || [],
            countries: res.data.countries || [],
            categories: res.data.categories || [],
            years: res.data.years || [],
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const yearOptions = useMemo(() => {
    if (Array.isArray(taxonomy.years) && taxonomy.years.length > 0) {
      return taxonomy.years;
    }
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 28 }, (_, i) => currentYear - i);
  }, [taxonomy.years]);

  // Load movies whenever filters change
  useEffect(() => {
    let active = true;
    setLoading(true);
    const limit = Number(settings.operations.movies_per_page) || 12;
    const params = {
      page: filters.page,
      limit,
      sort: filters.sort,
    };
    if (filters.q) params.q = filters.q;
    if (filters.genre) params.genre = filters.genre;
    if (filters.country) params.country = filters.country;
    if (filters.category) params.category = filters.category;
    if (filters.year) params.year = filters.year;
    if (filters.movie_status) params.movie_status = filters.movie_status;
    if (filters.type) params.type = filters.type;
    if (filters.access_type) params.access_type = filters.access_type;

    moviesApi
      .listMovies(params)
      .then((res) => {
        if (active) {
          setMovies(res?.data || []);
          setMeta(res?.meta || { page: filters.page, totalPages: 1, total: 0 });
        }
      })
      .catch(() => {
        if (active) {
          setMovies([]);
          setMeta({ page: 1, totalPages: 1, total: 0 });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, settings.operations.movies_per_page]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  // Unified Format handler: maps cleanly to either `type` or `category` without conflict
  const handleUnifiedFormatChange = (val) => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('type');
    next.delete('category');

    if (val.startsWith('type:')) {
      next.set('type', val.replace('type:', ''));
    } else if (val.startsWith('category:')) {
      next.set('category', val.replace('category:', ''));
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.genre ||
      filters.country ||
      filters.category ||
      filters.year ||
      filters.movie_status ||
      filters.type ||
      filters.access_type ||
      filters.sort !== 'newest'
  );

  const pageHeading = useMemo(() => {
    if (filters.q) return `Kết quả tìm kiếm: "${filters.q}"`;
    if (filters.type === 'SINGLE') return 'Kho Phim Lẻ';
    if (filters.type === 'SERIES') return 'Kho Phim Bộ';
    if (filters.category) {
      const matchedOpt = UNIFIED_FORMAT_OPTIONS.find(
        (opt) => opt.value === `category:${filters.category}`
      );
      if (matchedOpt) return matchedOpt.label;
    }
    if (filters.genre) {
      const matched = taxonomy.genres.find((g) => g.slug === filters.genre);
      if (matched) return `Phim thể loại ${matched.name}`;
    }
    if (filters.country) {
      const matched = taxonomy.countries.find((c) => c.slug === filters.country);
      if (matched) return `Phim quốc gia ${matched.name}`;
    }
    return 'Kho phim CINEMATIC';
  }, [filters, taxonomy]);

  const selectClass =
    'rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-cinema-red dark:text-slate-200';

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {pageHeading}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Tìm thấy{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{meta.total || 0}</span> bộ
          phim phù hợp
        </p>
      </div>

      {/* Multi-criteria Filter Box */}
      <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-sm sm:p-5 dark:shadow-none">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="h-4 w-4 text-cinema-red" />
            Bộ lọc nâng cao
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {/* External Sort Label + Clean Select */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="movie-sort"
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-cinema-red" />
                Sắp xếp:
              </label>
              <select
                id="movie-sort"
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-cinema-red dark:text-slate-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-300 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* 6 Clean Balanced Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Unified Format (Type + Category) */}
          <select
            value={unifiedFormatValue}
            onChange={(e) => handleUnifiedFormatChange(e.target.value)}
            className={selectClass}
            aria-label="Định dạng phim"
          >
            {UNIFIED_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={filters.genre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className={selectClass}
            aria-label="Thể loại"
          >
            <option value="">Tất cả thể loại</option>
            {taxonomy.genres.map((g) => (
              <option key={g.id} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Country */}
          <select
            value={filters.country}
            onChange={(e) => updateFilter('country', e.target.value)}
            className={selectClass}
            aria-label="Quốc gia"
          >
            <option value="">Tất cả quốc gia</option>
            {taxonomy.countries.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={filters.year}
            onChange={(e) => updateFilter('year', e.target.value)}
            className={selectClass}
            aria-label="Năm phát hành"
          >
            <option value="">Tất cả năm</option>
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                Năm {yr}
              </option>
            ))}
          </select>

          {/* Movie Status */}
          <select
            value={filters.movie_status}
            onChange={(e) => updateFilter('movie_status', e.target.value)}
            className={selectClass}
            aria-label="Trạng thái"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Access Type (Tất cả loại phim) */}
          <select
            value={filters.access_type}
            onChange={(e) => updateFilter('access_type', e.target.value)}
            className={selectClass}
            aria-label="Loại phim"
          >
            {ACCESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movie Grid Results */}
      {loading ? (
        <MovieGridSkeleton count={10} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Không tìm thấy bộ phim phù hợp"
          description="Hãy thử nới lỏng điều kiện lọc hoặc tìm kiếm bằng từ khóa khác."
          action={
            hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
              >
                Xóa bộ lọc và xem tất cả
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              updateFilter('page', String(nextPage));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
