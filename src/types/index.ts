export type UserRole = "admin" | "organizer" | "coordinator" | "viewer";

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: "starter" | "professional" | "enterprise";
  created_at: string;
}

export type EventType =
  | "conference"
  | "exhibition"
  | "meeting"
  | "incentive"
  | "seminar"
  | "workshop"
  | "gala"
  | "other";

export type EventStatus =
  | "draft"
  | "planning"
  | "registration_open"
  | "live"
  | "completed"
  | "cancelled";

export interface MiceEvent {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description: string;
  event_type: EventType;
  status: EventStatus;
  venue_id: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  expected_attendees: number;
  actual_attendees: number;
  budget_cents: number;
  revenue_cents: number;
  currency: string;
  is_public: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  venue?: Venue;
  sessions?: Session[];
}

export interface Venue {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_title: string;
  room: string;
  start_time: string;
  end_time: string;
  capacity: number;
  registered_count: number;
  created_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  registration_type: "general" | "vip" | "speaker" | "sponsor" | "media";
  checked_in: boolean;
  checked_in_at: string | null;
  ticket_price_cents: number;
  currency: string;
  nps_score: number | null;
  created_at: string;
}

export interface EventAnalytics {
  event_id: string;
  total_registrations: number;
  total_check_ins: number;
  check_in_rate: number;
  total_revenue_cents: number;
  avg_nps_score: number | null;
  session_attendance_rate: number;
  leads_generated: number;
  returning_attendees_pct: number;
}
