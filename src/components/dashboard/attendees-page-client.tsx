"use client";

import {
  useActionState,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  bulkSetAttendeeCheckIn,
  importAttendeesCsv,
  setAttendeeCheckIn,
} from "@/actions/attendees";
import type { OrgAttendeeRow } from "@/lib/data/attendees";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

const typeColors: Record<string, string> = {
  vip: "bg-[#0043CE]/20 text-info",
  speaker: "bg-[#198038]/20 text-accent",
  sponsor: "bg-[#8A3FFC]/20 text-[#BE95FF]",
  media: "bg-[#FA4D56]/20 text-warning",
  general: "bg-[#393939] text-text-secondary",
};

type Props = {
  rows: OrgAttendeeRow[];
  events: { id: string; title: string }[];
  canEdit: boolean;
};

export function AttendeesPageClient({ rows, events, canEdit }: Props) {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [importState, importAction, importPending] = useActionState(
    importAttendeesCsv,
    undefined,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowPending, startRow] = useTransition();
  const [bulkPending, startBulk] = useTransition();

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onToggleCheckIn(id: string, checked: boolean) {
    startRow(async () => {
      const r = await setAttendeeCheckIn(id, checked);
      if (r?.error) {
        window.alert(r.error);
        return;
      }
      router.refresh();
    });
  }

  function onBulk(checked: boolean) {
    const ids = [...selected];
    if (ids.length === 0) return;
    startBulk(async () => {
      const r = await bulkSetAttendeeCheckIn(ids, checked);
      if (r?.error) {
        window.alert(r.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  const gridClass = canEdit
    ? "grid-cols-[36px_minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(160px,1.2fr)_100px_100px] min-w-[940px]"
    : "grid-cols-[minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(160px,1.2fr)_100px_100px] min-w-[900px]";

  return (
    <>
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-background px-6 min-h-12 py-2">
        <h1 className="text-sm font-medium text-text-primary">Attendees</h1>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && selected.size > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={bulkPending}
                onClick={() => onBulk(true)}
              >
                Check in ({selected.size})
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                type="button"
                disabled={bulkPending}
                onClick={() => onBulk(false)}
              >
                Uncheck ({selected.size})
              </Button>
            </>
          )}
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={events.length === 0}
              onClick={() => setImportOpen(true)}
            >
              Import CSV
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {canEdit && events.length === 0 && (
          <p className="mb-4 text-xs text-text-tertiary">
            Create an event first, then import attendees for that event.
          </p>
        )}
        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          <div
            className={`grid gap-4 px-5 py-2 border-b border-border-subtle text-xs font-medium text-text-tertiary uppercase tracking-wider items-center ${gridClass}`}
          >
            {canEdit && (
              <span className="flex justify-center">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  aria-label="Select all attendees"
                  className="h-3.5 w-3.5 accent-primary"
                />
              </span>
            )}
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Event</span>
            <span>Type</span>
            <span>Check-in</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-tertiary">
              No attendees yet. Use Import CSV to add rows for an event.
            </div>
          ) : (
            rows.map((a) => (
              <div
                key={a.id}
                className={`grid gap-4 px-5 py-3 border-b border-border-subtle last:border-b-0 hover:bg-layer-02 transition-colors items-center ${gridClass}`}
              >
                {canEdit && (
                  <span className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleRow(a.id)}
                      aria-label={`Select ${a.name}`}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                  </span>
                )}
                <span className="text-sm text-text-primary">{a.name}</span>
                <span className="text-xs text-text-tertiary truncate">
                  {a.email}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {a.company}
                </span>
                <span className="text-xs text-text-tertiary truncate">
                  {a.eventTitle}
                </span>
                <span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium ${typeColors[a.registrationKey] ?? typeColors.general}`}
                  >
                    {a.registrationLabel}
                  </span>
                </span>
                <span className="flex justify-center">
                  {canEdit ? (
                    <button
                      type="button"
                      disabled={rowPending}
                      onClick={() => onToggleCheckIn(a.id, !a.checkedIn)}
                      className="rounded-sm p-1 text-text-tertiary hover:bg-layer-03 hover:text-text-primary transition-colors disabled:opacity-50"
                      title={
                        a.checkedIn ? "Mark as not checked in" : "Check in"
                      }
                    >
                      {a.checkedIn ? (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  ) : a.checkedIn ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <Circle className="h-4 w-4 text-text-tertiary" />
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {importOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setImportOpen(false);
          }}
        >
          <div
            className="w-full max-w-md border border-border-subtle bg-background p-6 shadow-lg"
            role="dialog"
            aria-labelledby="import-csv-title"
          >
            <h2
              id="import-csv-title"
              className="text-lg font-semibold text-text-primary"
            >
              Import attendees (CSV)
            </h2>
            <p className="mt-2 text-xs text-text-tertiary leading-relaxed">
              Required column: <code className="text-text-secondary">email</code>
              . Optional:{" "}
              <code className="text-text-secondary">
                first_name, last_name, company, registration_type
              </code>{" "}
              (general, vip, speaker, sponsor, media). Duplicate emails for the
              same event are skipped.
            </p>
            <form
              className="mt-6 flex flex-col gap-4"
              action={importAction}
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                const fd = new FormData(e.currentTarget);
                const f = fd.get("file");
                if (!(f instanceof File) || f.size === 0) {
                  e.preventDefault();
                  window.alert("Choose a CSV file.");
                }
              }}
            >
              <div>
                <label
                  htmlFor="import-event"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Event
                </label>
                <select
                  id="import-event"
                  name="event_id"
                  required
                  className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
                >
                  <option value="">Select event…</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="import-file"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  CSV file
                </label>
                <input
                  id="import-file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="block w-full text-xs text-text-secondary file:mr-3 file:border-0 file:bg-surface-03 file:px-3 file:py-1.5 file:text-text-primary"
                />
              </div>
              {importState?.error && (
                <p className="text-xs text-danger">{importState.error}</p>
              )}
              {importState?.success && (
                <p className="text-xs text-accent">{importState.success}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {importState?.success ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setImportOpen(false);
                      router.refresh();
                    }}
                  >
                    Done
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setImportOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={importPending}
                    >
                      Import
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
