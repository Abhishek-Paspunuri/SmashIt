export default function AppLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="h-6 w-40 bg-[var(--color-surface-3)] rounded-lg" />

      {/* Card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-3)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-[var(--color-surface-3)] rounded-md" />
            <div className="h-3 w-1/2 bg-[var(--color-surface-3)] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
