"use client";

import { useActionState } from "react";
import {
  createVenue,
  updateVenue,
  type VenueFormState,
} from "@/actions/venues";
import type { VenueRow } from "@/lib/data/venues";
import { Button } from "@/components/ui/button";

export function VenueForm({ venue }: { venue?: VenueRow }) {
  const initialState: VenueFormState = undefined;
  const [state, formAction, pending] = useActionState(
    venue ? updateVenue : createVenue,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4 max-w-lg">
      {venue && <input type="hidden" name="venue_id" value={venue.id} />}

      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Venue name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={venue?.name}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          placeholder="Convention Center Hall A"
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Address
        </label>
        <input
          id="address"
          name="address"
          defaultValue={venue?.address}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            City
          </label>
          <input
            id="city"
            name="city"
            defaultValue={venue?.city}
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label
            htmlFor="country"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            Country
          </label>
          <input
            id="country"
            name="country"
            defaultValue={venue?.country}
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="capacity"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Capacity (seats / guests)
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={0}
          defaultValue={venue?.capacity ?? 0}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={pending}
        isLoading={pending}
      >
        {venue ? "Save venue" : "Add venue"}
      </Button>
    </form>
  );
}
