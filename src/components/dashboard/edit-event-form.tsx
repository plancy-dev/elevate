"use client";

import { useActionState } from "react";
import {
  updateEvent,
  type UpdateEventState,
} from "@/actions/events";
import { Button } from "@/components/ui/button";
import type { VenueRow } from "@/lib/data/venues";
import { toDatetimeLocalValue } from "@/lib/utils";

export type EditableEvent = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  status: string;
  start_date: string;
  end_date: string;
  timezone: string;
  expected_attendees: number;
  venue_id: string | null;
};

const initialState: UpdateEventState = undefined;

export function EditEventForm({
  event,
  venues,
}: {
  event: EditableEvent;
  venues: VenueRow[];
}) {
  const [state, formAction, pending] = useActionState(
    updateEvent,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4 max-w-lg">
      <input type="hidden" name="event_id" value={event.id} />

      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Event title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={event.title}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
        />
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={event.status}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        >
          <option value="draft">Draft</option>
          <option value="planning">Planning</option>
          <option value="registration_open">Registration Open</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="venue_id"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Venue (optional)
        </label>
        <select
          id="venue_id"
          name="venue_id"
          defaultValue={event.venue_id ?? ""}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        >
          <option value="">No venue</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.city ? ` — ${v.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="start_date"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            Start
          </label>
          <input
            id="start_date"
            name="start_date"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(event.start_date)}
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label
            htmlFor="end_date"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            End
          </label>
          <input
            id="end_date"
            name="end_date"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocalValue(event.end_date)}
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          defaultValue={event.timezone}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>

      <div>
        <label
          htmlFor="event_type"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Type
        </label>
        <select
          id="event_type"
          name="event_type"
          defaultValue={event.event_type}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        >
          <option value="conference">Conference</option>
          <option value="exhibition">Exhibition</option>
          <option value="meeting">Meeting</option>
          <option value="seminar">Seminar</option>
          <option value="workshop">Workshop</option>
          <option value="gala">Gala</option>
          <option value="incentive">Incentive</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="expected_attendees"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Expected attendees
        </label>
        <input
          id="expected_attendees"
          name="expected_attendees"
          type="number"
          min={0}
          defaultValue={event.expected_attendees}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={event.description}
          className="w-full bg-field border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={pending}
        isLoading={pending}
      >
        Save changes
      </Button>
    </form>
  );
}
