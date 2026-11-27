import { Star } from 'lucide-react';
import { useState } from 'react';

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export default function RatingStars({
  value = 0,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
  count,
}) {
  const [hovered, setHovered] = useState(0);
  const displayScore = interactive && hovered > 0 ? hovered : Number(value || 0);
  const iconClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayScore >= star;
          const halfFilled = !filled && displayScore >= star - 0.5;

          if (!interactive) {
            return (
              <Star
                key={star}
                className={`${iconClass} ${
                  filled || halfFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-slate-600'
                }`}
              />
            );
          }

          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange?.(star)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Đánh giá ${star} sao`}
            >
              <Star
                className={`${iconClass} transition-colors ${
                  filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {Number(value || 0).toFixed(1)}
          {typeof count === 'number' && (
            <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
