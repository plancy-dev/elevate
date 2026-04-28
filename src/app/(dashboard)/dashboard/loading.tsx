/**
 * Shown while a `/dashboard/*` route segment loads (RSC + client navigation).
 * Pairs with link-level `useLinkStatus` spinners on Sidebar / ButtonLink.
 */
export default function DashboardSegmentLoading() {
  return (
    <div
      className="flex min-h-[min(60vh,28rem)] w-full flex-col items-center justify-center gap-3 px-6 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        role="status"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
