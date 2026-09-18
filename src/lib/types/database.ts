// Hand-written to match supabase/migrations/0001_init.sql.
// Once a live Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts

export type UserRole = "admin" | "field_agent";
export type BoardType =
  | "unipole"
  | "hoarding"
  | "gantry"
  | "led_screen"
  | "wall_wrap"
  | "bus_shelter"
  | "other";
export type BoardStatus =
  | "available"
  | "booked"
  | "under_maintenance"
  | "damaged"
  | "pending_installation";
export type LightingType = "backlit" | "frontlit" | "none";
export type SizeCategory = "small" | "medium" | "large";
export type PhotoCategory = "listing" | "maintenance_reported" | "maintenance_resolved";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          code: string;
          name: string;
          city: string;
          address: string | null;
          lat: number;
          lng: number;
          board_type: BoardType;
          size_label: string | null;
          size_category: SizeCategory | null;
          lighting_type: LightingType | null;
          region: string | null;
          status: BoardStatus;
          permit_expiry_date: string | null;
          permit_authority: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["boards"]["Row"]> & {
          code: string;
          name: string;
          city: string;
          lat: number;
          lng: number;
        };
        Update: Partial<Database["public"]["Tables"]["boards"]["Row"]>;
        Relationships: [];
      };
      board_status_history: {
        Row: {
          id: string;
          board_id: string;
          changed_by: string | null;
          old_status: BoardStatus | null;
          new_status: BoardStatus;
          photo_url: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["board_status_history"]["Row"]> & {
          board_id: string;
          new_status: BoardStatus;
        };
        Update: Partial<Database["public"]["Tables"]["board_status_history"]["Row"]>;
        Relationships: [];
      };
      board_photos: {
        Row: {
          id: string;
          board_id: string;
          maintenance_request_id: string | null;
          category: PhotoCategory;
          photo_url: string;
          caption: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["board_photos"]["Row"]> & {
          board_id: string;
          photo_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["board_photos"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_board_status_update: {
        Args: {
          p_board_id: string;
          p_new_status: BoardStatus;
          p_note?: string | null;
        };
        Returns: void;
      };
    };
  };
}

export type Board = Database["public"]["Tables"]["boards"]["Row"];
export type BoardStatusHistoryEntry = Database["public"]["Tables"]["board_status_history"]["Row"];
export type BoardPhoto = Database["public"]["Tables"]["board_photos"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
