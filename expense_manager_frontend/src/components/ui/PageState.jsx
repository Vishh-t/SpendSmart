// ─── Expenses page skeleton ──────────────────────────────────────────────────────
export function ExpensesSkeleton() {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SkeletonBlock className="h-7 md:h-8 w-32" />
                    <SkeletonBlock className="h-3 w-56 mt-2" />
                </div>
                <div className="hidden sm:flex gap-6 md:gap-8">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex flex-col items-end gap-1.5">
                            <SkeletonBlock className="h-2.5 w-20" />
                            <SkeletonBlock className="h-5 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <SkeletonBlock className="h-10 flex-1" />
                <div className="flex gap-2 shrink-0">
                    <SkeletonBlock className="h-10 w-28" />
                    <SkeletonBlock className="h-10 w-24" />
                </div>
            </div>

            {/* Desktop table */}
            <div className="bg-surface-high rounded-xl hidden md:block p-5">
                <div className="flex gap-4 mb-4">
                    {["w-16","w-32","w-20","w-20","w-16"].map((w, i) => (
                        <SkeletonBlock key={i} className={`h-2.5 ${w}`} />
                    ))}
                </div>
                {[0, 1, 2, 3, 4].map(row => (
                    <div key={row} className="flex items-center gap-4 py-3.5 border-t border-surface-bright">
                        <SkeletonBlock className="h-3 w-16" />
                        <SkeletonBlock className="h-3 w-40 flex-1" />
                        <SkeletonBlock className="h-5 w-20 rounded-full" />
                        <SkeletonBlock className="h-3 w-14" />
                        <SkeletonBlock className="h-3 w-10" />
                    </div>
                ))}
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-3 md:hidden">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="bg-surface-high rounded-xl p-4 flex items-start gap-3">
                        <div className="flex-1 flex flex-col gap-2">
                            <SkeletonBlock className="h-3.5 w-2/3" />
                            <SkeletonBlock className="h-2.5 w-1/3" />
                        </div>
                        <SkeletonBlock className="h-3.5 w-12 shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
// Reusable loading and error state components
// Used across Dashboard, ExpensesPage, ProfilePage etc.

export function LoadingState({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center h-full min-h-48">
            <p className="text-text-secondary text-sm">{message}</p>
        </div>
    );
}

export function ErrorState({ message = "Something went wrong." }) {
    return (
        <div className="flex items-center justify-center h-full min-h-48">
            <p className="text-error text-sm">{message}</p>
        </div>
    );
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────
// Shimmer block — base building piece for all skeletons.
export function SkeletonBlock({ className = "", style = {} }) {
    return (
        <div
            className={`animate-pulse rounded-lg ${className}`}
            style={{ backgroundColor: "var(--color-surface-low)", ...style }}
        />
    );
}

// ─── Dashboard skeleton ────────────────────────────────────────────────────────
export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div>
                <SkeletonBlock className="h-7 md:h-8 w-40" />
                <SkeletonBlock className="h-3 w-48 mt-2" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="bg-surface-high rounded-xl p-4 flex flex-col gap-2">
                        <SkeletonBlock className="h-2.5 w-16" />
                        <SkeletonBlock className="h-6 w-20" />
                        <SkeletonBlock className="h-2.5 w-24" />
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-surface-high rounded-xl p-5 flex-1 flex flex-col gap-4">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-40 w-full" />
                </div>
                <div className="bg-surface-high rounded-xl p-5 md:w-72 flex flex-col items-center gap-4">
                    <SkeletonBlock className="h-4 w-28 self-start" />
                    <SkeletonBlock className="h-36 w-36 rounded-full" />
                </div>
            </div>

            {/* Recent expenses */}
            <div className="bg-surface-high rounded-xl p-5 flex flex-col gap-3">
                <SkeletonBlock className="h-4 w-36" />
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between gap-4 py-1">
                        <SkeletonBlock className="h-3 w-1/3" />
                        <SkeletonBlock className="h-3 w-16" />
                        <SkeletonBlock className="h-3 w-14" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Categories page skeleton ──────────────────────────────────────────────────
export function CategoriesSkeleton() {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SkeletonBlock className="h-7 md:h-8 w-36" />
                    <SkeletonBlock className="h-3 w-52 mt-2" />
                </div>
                <div className="hidden sm:flex gap-6 md:gap-8">
                    {[0, 1].map(i => (
                        <div key={i} className="flex flex-col items-end gap-1.5">
                            <SkeletonBlock className="h-2.5 w-20" />
                            <SkeletonBlock className="h-5 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="rounded-2xl p-5 md:p-6 flex flex-col gap-3 md:gap-4 bg-surface-high">
                        <SkeletonBlock className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                        <div className="flex flex-col gap-1.5">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-2.5 w-20" />
                        </div>
                        <SkeletonBlock className="h-6 w-24" />
                        <SkeletonBlock className="h-1.5 w-full rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Profile page skeleton ──────────────────────────────────────────────────────
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Mobile-style avatar card (shows on all sizes for simplicity, matches actual layout reasonably) */}
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-surface-high">
                <SkeletonBlock className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-2.5 w-24" />
                    <SkeletonBlock className="h-2.5 w-40" />
                </div>
            </div>

            {/* Budget card */}
            <div className="rounded-2xl p-5 flex flex-col gap-3 bg-surface-high">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-8 w-40" />
                <SkeletonBlock className="h-2.5 w-28" />
            </div>

            {/* Two column section (desktop) */}
            <div className="hidden md:grid grid-cols-2 gap-6">
                <div className="rounded-xl p-6 flex flex-col gap-3 bg-surface-high">
                    <SkeletonBlock className="h-4 w-44" />
                    <SkeletonBlock className="h-2.5 w-56" />
                    <SkeletonBlock className="h-11 w-full rounded-xl mt-2" />
                </div>
                <div className="rounded-xl p-6 flex flex-col gap-3 bg-surface-high">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-2.5 w-48" />
                    <SkeletonBlock className="h-9 w-32 rounded-xl mt-2" />
                </div>
            </div>

            {/* Heatmap placeholder */}
            <div className="hidden md:flex bg-surface-high rounded-xl p-6 flex-col gap-4">
                <SkeletonBlock className="h-4 w-48" />
                <SkeletonBlock className="h-32 w-full" />
            </div>
        </div>
    );
}
