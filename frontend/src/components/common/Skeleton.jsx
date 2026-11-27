export function MovieCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-cinema-border/60 bg-cinema-surface">
      <div className="aspect-[2/3] w-full bg-cinema-card" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-4/5 rounded bg-cinema-card" />
        <div className="h-3 w-3/5 rounded bg-cinema-card" />
        <div className="flex justify-between pt-1">
          <div className="h-3 w-1/3 rounded bg-cinema-card" />
          <div className="h-3 w-1/4 rounded bg-cinema-card" />
        </div>
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[440px] w-full animate-pulse overflow-hidden rounded-3xl border border-cinema-border bg-cinema-surface sm:h-[520px]">
      <div className="absolute bottom-10 left-6 right-6 max-w-xl space-y-4 sm:left-12">
        <div className="h-5 w-32 rounded-full bg-cinema-card" />
        <div className="h-10 w-4/5 rounded-xl bg-cinema-card" />
        <div className="h-4 w-full rounded bg-cinema-card" />
        <div className="h-4 w-2/3 rounded bg-cinema-card" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-36 rounded-xl bg-cinema-card" />
          <div className="h-11 w-32 rounded-xl bg-cinema-card" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="aspect-[2/3] w-full rounded-2xl bg-cinema-card" />
        </div>
        <div className="space-y-4 lg:col-span-9">
          <div className="h-8 w-2/3 rounded-xl bg-cinema-card" />
          <div className="h-4 w-1/3 rounded bg-cinema-card" />
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-full bg-cinema-card" />
            <div className="h-7 w-24 rounded-full bg-cinema-card" />
            <div className="h-7 w-16 rounded-full bg-cinema-card" />
          </div>
          <div className="h-24 w-full rounded-xl bg-cinema-card" />
          <div className="flex gap-3">
            <div className="h-12 w-40 rounded-xl bg-cinema-card" />
            <div className="h-12 w-40 rounded-xl bg-cinema-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
