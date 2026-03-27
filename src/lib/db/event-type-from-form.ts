import { Constants } from "@/types/database.types";

export type EventTypeValue = (typeof Constants.public.Enums.event_type)[number];

/** Parses `event_type` from form data; invalid values fall back to `conference`. */
export function eventTypeFromForm(formData: FormData): EventTypeValue {
  const raw = String(formData.get("event_type") ?? "conference").trim();
  const allowed = Constants.public.Enums.event_type;
  return (allowed as readonly string[]).includes(raw)
    ? (raw as EventTypeValue)
    : "conference";
}
