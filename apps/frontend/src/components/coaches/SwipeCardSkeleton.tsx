export function SwipeCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-card overflow-hidden">
      {/* Image placeholder */}
      <div className="w-full aspect-[3/4] bg-marble-200 animate-shimmer" />

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Name */}
        <div className="h-7 w-40 bg-marble-200 rounded-lg animate-shimmer" />

        {/* Price + tags row */}
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gold-50 rounded-full animate-shimmer" />
          <div className="h-6 w-16 bg-cupid-50 rounded-full animate-shimmer" />
          <div className="h-6 w-14 bg-cupid-50 rounded-full animate-shimmer" />
        </div>

        {/* Specialty */}
        <div className="h-4 w-24 bg-marble-200 rounded animate-shimmer" />

        {/* Quote */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-marble-100 rounded animate-shimmer" />
          <div className="h-4 w-3/4 bg-marble-100 rounded animate-shimmer" />
        </div>

        {/* Voice button */}
        <div className="h-10 w-32 bg-marble-200 rounded-xl animate-shimmer" />
      </div>
    </div>
  )
}
