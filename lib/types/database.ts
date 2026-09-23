export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";
export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded";
export type ContentStatus = "draft" | "preview" | "published" | "archived";
export type UserRole = "super_admin" | "admin" | "editor";
export type NotificationChannel = "email" | "whatsapp";
export type NotificationStatus = "sent" | "delivered" | "read" | "failed";

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          original_price_paise: number;
          offer_price_paise: number;
          currency: string;
          duration_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          original_price_paise: number;
          offer_price_paise: number;
          currency?: string;
          duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          original_price_paise?: number;
          offer_price_paise?: number;
          currency?: string;
          duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cohort_batches: {
        Row: {
          id: string;
          course_id: string;
          batch_name: string;
          start_date: string;
          end_date: string | null;
          start_time: string;
          end_time: string;
          timezone: string;
          total_seats: number;
          seats_booked: number;
          is_enrollment_open: boolean;
          zoom_join_url: string | null;
          zoom_passcode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          batch_name: string;
          start_date: string;
          end_date?: string | null;
          start_time: string;
          end_time: string;
          timezone?: string;
          total_seats?: number;
          seats_booked?: number;
          is_enrollment_open?: boolean;
          zoom_join_url?: string | null;
          zoom_passcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          batch_name?: string;
          start_date?: string;
          end_date?: string | null;
          start_time?: string;
          end_time?: string;
          timezone?: string;
          total_seats?: number;
          seats_booked?: number;
          is_enrollment_open?: boolean;
          zoom_join_url?: string | null;
          zoom_passcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          whatsapp_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_reference: string;
          customer_id: string;
          batch_id: string;
          status: BookingStatus;
          amount_paise: number;
          currency: string;
          seat_released: boolean;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_reference: string;
          customer_id: string;
          batch_id: string;
          status?: BookingStatus;
          amount_paise: number;
          currency?: string;
          seat_released?: boolean;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_reference?: string;
          customer_id?: string;
          batch_id?: string;
          status?: BookingStatus;
          amount_paise?: number;
          currency?: string;
          seat_released?: boolean;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount_paise: number;
          currency: string;
          status: PaymentStatus;
          idempotency_key: string | null;
          payload_snapshot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount_paise: number;
          currency?: string;
          status?: PaymentStatus;
          idempotency_key?: string | null;
          payload_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          razorpay_order_id?: string;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount_paise?: number;
          currency?: string;
          status?: PaymentStatus;
          idempotency_key?: string | null;
          payload_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      landing_content: {
        Row: {
          id: string;
          section_key: string;
          content_json: Json;
          status: ContentStatus;
          version: number;
          created_by: string | null;
          published_at: string | null;
          published_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_key: string;
          content_json: Json;
          status?: ContentStatus;
          version?: number;
          created_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_key?: string;
          content_json?: Json;
          status?: ContentStatus;
          version?: number;
          created_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_logs: {
        Row: {
          id: string;
          booking_id: string | null;
          customer_id: string | null;
          channel: NotificationChannel;
          message_type: string;
          provider_message_id: string | null;
          status: NotificationStatus;
          error_message: string | null;
          retry_count: number;
          sent_at: string;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          customer_id?: string | null;
          channel: NotificationChannel;
          message_type: string;
          provider_message_id?: string | null;
          status?: NotificationStatus;
          error_message?: string | null;
          retry_count?: number;
          sent_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          customer_id?: string | null;
          channel?: NotificationChannel;
          message_type?: string;
          provider_message_id?: string | null;
          status?: NotificationStatus;
          error_message?: string | null;
          retry_count?: number;
          sent_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      media_assets: {
        Row: {
          id: string;
          bucket: string;
          file_path: string;
          public_url: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number;
          alt_text: string | null;
          category: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bucket: string;
          file_path: string;
          public_url: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number;
          alt_text?: string | null;
          category?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bucket?: string;
          file_path?: string;
          public_url?: string;
          file_name?: string;
          mime_type?: string;
          file_size_bytes?: number;
          alt_text?: string | null;
          category?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          slug: string;
          channel: NotificationChannel;
          name: string;
          subject: string | null;
          body: string;
          variables: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          channel: NotificationChannel;
          name: string;
          subject?: string | null;
          body: string;
          variables?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          channel?: NotificationChannel;
          name?: string;
          subject?: string | null;
          body?: string;
          variables?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      broadcasts: {
        Row: {
          id: string;
          title: string;
          channel: NotificationChannel | "both";
          target_filter: Json;
          content: string;
          total_recipients: number;
          successful_sends: number;
          failed_sends: number;
          status: "draft" | "pending" | "processing" | "completed" | "failed";
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          channel: NotificationChannel | "both";
          target_filter?: Json;
          content: string;
          total_recipients?: number;
          successful_sends?: number;
          failed_sends?: number;
          status?: "draft" | "pending" | "processing" | "completed" | "failed";
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          channel?: NotificationChannel | "both";
          target_filter?: Json;
          content?: string;
          total_recipients?: number;
          successful_sends?: number;
          failed_sends?: number;
          status?: "draft" | "pending" | "processing" | "completed" | "failed";
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      public_cohort_batches: {
        Row: {
          id: string;
          course_id: string;
          batch_name: string;
          start_date: string;
          end_date: string | null;
          start_time: string;
          end_time: string;
          timezone: string;
          total_seats: number;
          seats_booked: number;
          is_enrollment_open: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      reserve_seat_atomic: {
        Args: {
          p_batch_id: string;
          p_customer_id: string;
          p_amount_paise: number;
          p_booking_reference: string;
        };
        Returns: {
          success: boolean;
          booking_id: string | null;
          error_code: string | null;
          message: string | null;
          seats_remaining: number | null;
        };
      };
      release_seat_atomic: {
        Args: {
          p_booking_id: string;
          p_reason?: string;
        };
        Returns: {
          success: boolean;
          already_released: boolean;
          message: string | null;
          error_code?: string | null;
        };
      };
      release_expired_pending_bookings: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          expired_bookings_released: number;
        };
      };
    };
  };
}
