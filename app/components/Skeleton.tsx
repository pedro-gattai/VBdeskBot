/**
 * Skeleton loading components following Fintech UX patterns
 * Reference: Solana mobile UX patterns (Dec 2025)
 */

export function AuctionCardSkeleton() {
  return (
    <div className="card-dark animate-pulse">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-slate-600 rounded w-3/4"></div>
          <div className="h-6 bg-slate-600 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-slate-600 rounded w-full"></div>
        <div className="h-4 bg-slate-600 rounded w-2/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-600 rounded w-1/4"></div>
          <div className="h-8 bg-slate-600 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function AuctionDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        <div className="h-8 bg-slate-600 rounded w-3/4"></div>
        <div className="h-6 bg-slate-600 rounded w-full"></div>
        <div className="h-6 bg-slate-600 rounded w-2/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-dark space-y-4">
          <div className="h-4 bg-slate-600 rounded"></div>
          <div className="h-8 bg-slate-600 rounded"></div>
        </div>
        <div className="card-dark space-y-4">
          <div className="h-4 bg-slate-600 rounded"></div>
          <div className="h-8 bg-slate-600 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="card-dark space-y-4 animate-pulse">
      <div className="h-6 bg-slate-600 rounded"></div>
      <div className="space-y-4">
        <div className="h-10 bg-slate-600 rounded"></div>
        <div className="h-10 bg-slate-600 rounded"></div>
        <div className="h-10 bg-slate-600 rounded"></div>
      </div>
    </div>
  );
}

export function AuctionListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <AuctionCardSkeleton key={i} />
      ))}
    </div>
  );
}
