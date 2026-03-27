"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  createSession,
  deleteSession,
  updateSession,
  type SessionActionState,
} from "@/actions/sessions";
import type { EventDetailPageData } from "@/lib/data/events";
import { toDatetimeLocalValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SessionRow = EventDetailPageData["sessions"][number];

const initialState: SessionActionState = undefined;

function SessionEditForm({
  session,
  onCancel,
  onSuccess,
}: {
  session: SessionRow;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateSession,
    initialState,
  );

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-3 p-4 bg-layer-02 border border-border-subtle">
      <input type="hidden" name="session_id" value={session.id} />
      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Title</label>
        <input
          name="title"
          required
          defaultValue={session.title}
          className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Start</label>
          <input
            name="start_time"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(session.start_time)}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">End</label>
          <input
            name="end_time"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(session.end_time)}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Speaker</label>
          <input
            name="speaker_name"
            defaultValue={session.speaker_name}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Title (role)</label>
          <input
            name="speaker_title"
            defaultValue={session.speaker_title}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Room</label>
        <input
          name="room"
          defaultValue={session.room}
          className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Capacity</label>
        <input
          name="capacity"
          type="number"
          min={0}
          defaultValue={session.capacity}
          className="h-9 w-full max-w-[120px] bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={session.description}
          className="w-full bg-field border border-border-subtle px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" type="submit" isLoading={pending}>
          Save session
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={deleteSession}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Delete this session?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <Button variant="ghost" size="sm" type="submit">
        Delete
      </Button>
    </form>
  );
}

function AddSessionForm({ eventId, formKey }: { eventId: string; formKey: string }) {
  const [state, formAction, pending] = useActionState(
    createSession,
    initialState,
  );

  return (
    <form
      key={formKey}
      action={formAction}
      className="space-y-3 p-4 border border-border-subtle border-dashed bg-layer-02/50"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <p className="text-xs font-medium text-text-secondary">Add session</p>
      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label className="block text-xs text-text-secondary mb-1">Title</label>
        <input
          name="title"
          required
          placeholder="Keynote"
          className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Start</label>
          <input
            name="start_time"
            type="datetime-local"
            required
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">End</label>
          <input
            name="end_time"
            type="datetime-local"
            required
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Speaker</label>
          <input
            name="speaker_name"
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Role</label>
          <input
            name="speaker_title"
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Room</label>
        <input
          name="room"
          className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Capacity</label>
        <input
          name="capacity"
          type="number"
          min={0}
          defaultValue={0}
          className="h-9 w-full max-w-[120px] bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          className="w-full bg-field border border-border-subtle px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <Button variant="primary" size="sm" type="submit" isLoading={pending}>
        Add session
      </Button>
    </form>
  );
}

export function EventSessionsPanel({
  eventId,
  canEdit,
  sessions,
}: {
  eventId: string;
  canEdit: boolean;
  sessions: SessionRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const addFormKey = `${sessions.length}-${sessions.map((s) => s.id).join(",")}`;
  const closeEdit = useCallback(() => setEditingId(null), []);

  return (
    <div className="space-y-0">
      {canEdit && (
        <div className="px-5 pb-4 border-b border-border-subtle">
          <AddSessionForm eventId={eventId} formKey={addFormKey} />
        </div>
      )}
      {sessions.length === 0 ? (
        <div className="px-5 py-8 text-sm text-text-tertiary">
          {canEdit
            ? "No sessions yet. Add one above."
            : "No sessions scheduled for this event yet."}
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {sessions.map((session) => {
            const cap = session.capacity || 1;
            const fillPct = Math.round(
              (session.registered_count / cap) * 100,
            );
            return (
              <div key={session.id}>
                {editingId === session.id ? (
                  <div className="p-2">
                    <SessionEditForm
                      session={session}
                      onCancel={closeEdit}
                      onSuccess={closeEdit}
                    />
                  </div>
                ) : (
                  <div className="px-5 py-3.5 hover:bg-layer-02 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-tertiary font-mono whitespace-nowrap">
                            {session.timeLabel}
                          </span>
                          <span className="text-sm font-medium text-text-primary truncate">
                            {session.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                          <span>{session.speaker_line}</span>
                          <span>·</span>
                          <span>
                            {session.room?.trim() ? session.room : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-sm text-text-primary">
                            {session.registered_count}/{session.capacity}
                          </div>
                          <div className="w-20 h-1 bg-surface-03 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${fillPct >= 100 ? "bg-danger" : fillPct >= 80 ? "bg-warning" : "bg-primary"}`}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
                            />
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setEditingId(session.id)}
                            >
                              Edit
                            </Button>
                            <DeleteSessionButton sessionId={session.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
