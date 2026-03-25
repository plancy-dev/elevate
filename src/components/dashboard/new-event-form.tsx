"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "@/actions/events";
import { Button } from "@/components/ui/button";

const initialState: CreateEventState = undefined;

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(
    createEvent,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4 max-w-lg">
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
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
          placeholder="Global Tech Summit 2026"
        />
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
          defaultValue="UTC"
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
          Expected attendees (optional)
        </label>
        <input
          id="expected_attendees"
          name="expected_attendees"
          type="number"
          min={0}
          defaultValue={0}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full bg-field border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
          placeholder="Brief summary for your team"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={pending}
        isLoading={pending}
      >
        Create event
      </Button>
    </form>
  );
}
