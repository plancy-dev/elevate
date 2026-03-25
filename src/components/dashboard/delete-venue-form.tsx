"use client";

import { deleteVenue } from "@/actions/venues";
import { Button } from "@/components/ui/button";

export function DeleteVenueForm({ venueId }: { venueId: string }) {
  return (
    <form
      action={deleteVenue}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this venue? Events linked to it will have the venue cleared.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="venue_id" value={venueId} />
      <Button variant="danger" size="sm" type="submit">
        Delete
      </Button>
    </form>
  );
}
