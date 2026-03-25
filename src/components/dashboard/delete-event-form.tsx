"use client";

import { deleteEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function DeleteEventForm({ eventId }: { eventId: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this event permanently? Sessions and attendee links may be removed. This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <Button variant="danger" size="sm" type="submit">
        Delete event
      </Button>
    </form>
  );
}
