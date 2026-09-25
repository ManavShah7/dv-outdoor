import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Client enquiries, read from Postgres.
 *
 * These were being written by /api/enquiry and read by nothing — a lead could
 * sit in a table for a week with nobody aware of it. The office sees them here.
 */

export type RequestStatus =
  | "new"
  | "contacted"
  | "negotiating"
  | "converted"
  | "declined"
  | "lost";

export type Enquiry = {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  message: string | null;
  startDate: string | null;
  durationDays: number | null;
  status: RequestStatus;
  declineReason: string | null;
  contactedAt: string | null;
  createdAt: string;
  board: { code: string; name: string; city: string } | null;
};

type Row = {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  message: string | null;
  requested_start_date: string | null;
  requested_duration_days: number | null;
  status: RequestStatus;
  decline_reason: string | null;
  contacted_at: string | null;
  created_at: string;
  boards: { code: string; name: string; city: string } | null;
};

const SELECT =
  "id,company_name,contact_person,phone,email,message,requested_start_date," +
  "requested_duration_days,status,decline_reason,contacted_at,created_at," +
  "boards(code,name,city)";

function shape(r: Row): Enquiry {
  return {
    id: r.id,
    companyName: r.company_name,
    contactPerson: r.contact_person,
    phone: r.phone,
    email: r.email,
    message: r.message,
    startDate: r.requested_start_date,
    durationDays: r.requested_duration_days,
    status: r.status,
    declineReason: r.decline_reason,
    contactedAt: r.contacted_at,
    createdAt: r.created_at,
    board: r.boards ?? null,
  };
}

/**
 * Newest first, and everything — a closed enquiry is still the record of a
 * conversation, and the analytics page will want the losses as much as the
 * wins.
 */
export async function getEnquiries(): Promise<Enquiry[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("client_requests")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`getEnquiries: ${error.message}`);
  return (data as unknown as Row[]).map(shape);
}
