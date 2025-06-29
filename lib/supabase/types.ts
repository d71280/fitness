// Supabaseデータベース型定義（完全版）
export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: number
          name: string
          color_class: string
          text_color_class: string
          default_duration: number
          description: string | null
          default_instructor_id: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          color_class?: string
          text_color_class?: string
          default_duration?: number
          description?: string | null
          default_instructor_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          color_class?: string
          text_color_class?: string
          default_duration?: number
          description?: string | null
          default_instructor_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      instructors: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          specialties: string[]
          bio: string | null
          profile_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          specialties: string[]
          bio?: string | null
          profile_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          specialties?: string[]
          bio?: string | null
          profile_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: number
          name: string
          capacity: number
          equipment: string[]
          description: string | null
          operating_hours: any | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          capacity: number
          equipment: string[]
          description?: string | null
          operating_hours?: any | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          capacity?: number
          equipment?: string[]
          description?: string | null
          operating_hours?: any | null
          is_active?: boolean
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: number
          date: string
          start_time: string
          end_time: string
          capacity: number
          recurring_group_id: string | null
          recurring_type: string | null
          recurring_end_date: string | null
          recurring_count: number | null
          is_cancelled: boolean
          cancellation_reason: string | null
          program_id: number
          instructor_id: number
          studio_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          start_time: string
          end_time: string
          capacity: number
          recurring_group_id?: string | null
          recurring_type?: string | null
          recurring_end_date?: string | null
          recurring_count?: number | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          program_id: number
          instructor_id: number
          studio_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          start_time?: string
          end_time?: string
          capacity?: number
          recurring_group_id?: string | null
          recurring_type?: string | null
          recurring_end_date?: string | null
          recurring_count?: number | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          program_id?: number
          instructor_id?: number
          studio_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: number
          name: string
          line_id: string | null
          phone: string | null
          email: string | null
          membership_type: string
          preferred_programs: number[]
          cancellation_count: number
          last_booking_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          line_id?: string | null
          phone?: string | null
          email?: string | null
          membership_type?: string
          preferred_programs?: number[]
          cancellation_count?: number
          last_booking_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          line_id?: string | null
          phone?: string | null
          email?: string | null
          membership_type?: string
          preferred_programs?: number[]
          cancellation_count?: number
          last_booking_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: number
          schedule_id: number
          customer_id: number
          status: string
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          schedule_id: number
          customer_id: number
          status?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          schedule_id?: number
          customer_id?: number
          status?: string
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      waiting_list: {
        Row: {
          id: number
          schedule_id: number
          customer_id: number
          position: number
          notified_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          schedule_id: number
          customer_id: number
          position: number
          notified_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          schedule_id?: number
          customer_id?: number
          position?: number
          notified_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: number
          customer_id: number
          reservation_id: number | null
          notification_type: string
          message_content: any
          sent_at: string | null
          lstep_response: any | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: number
          customer_id: number
          reservation_id?: number | null
          notification_type: string
          message_content: any
          sent_at?: string | null
          lstep_response?: any | null
          success: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          customer_id?: number
          reservation_id?: number | null
          notification_type?: string
          message_content?: any
          sent_at?: string | null
          lstep_response?: any | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: number
          email: string
          password: string
          name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          email: string
          password: string
          name: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          email?: string
          password?: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}