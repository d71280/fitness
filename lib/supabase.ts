import { createBrowserClient } from '@supabase/ssr'

// クライアントサイド用（ブラウザ）
export function createClientComponentClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // 環境変数が設定されていない場合はダミーの値を使用
  if (!supabaseUrl || supabaseUrl === "your_supabase_project_url" || 
      !supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key") {
    return createBrowserClient(
      "https://dummy.supabase.co",
      "dummy-anon-key"
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// データベース型定義
export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: number
          name: string
          description: string | null
          default_duration: number
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          default_duration: number
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          default_duration?: number
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instructors: {
        Row: {
          id: number
          name: string
          email: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: number
          name: string
          capacity: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          capacity: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          capacity?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: number
          date: string
          time: string
          duration: number
          capacity: number
          program_id: number
          instructor_id: number
          studio_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          time: string
          duration: number
          capacity: number
          program_id: number
          instructor_id: number
          studio_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          time?: string
          duration?: number
          capacity?: number
          program_id?: number
          instructor_id?: number
          studio_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: number
          schedule_id: number
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          line_id: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          schedule_id: number
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          line_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          schedule_id?: number
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          line_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}