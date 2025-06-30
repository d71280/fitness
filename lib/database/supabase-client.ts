import { createApiRouteClient, createClientComponentClient } from '../supabase'

// API Routes用のクライアント取得
function getServerClient() {
  return createApiRouteClient()
}

// クライアント用のクライアント取得
function getClientClient() {
  return createClientComponentClient()
}

// プログラム関連
export const programsService = {
  async getAll() {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: number) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
}



// スケジュール関連
export const schedulesService = {
  async getWeeklySchedules(startDate: string, endDate: string) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        program:programs(*),
        reservations(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('time')
    
    if (error) throw error
    return data
  },

  async create(schedule: any) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async createRecurring(schedules: any[]) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedules)
      .select()
    
    if (error) throw error
    return data
  }
}

// 予約関連
export const reservationsService = {
  async create(reservation: any) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByScheduleId(scheduleId: number) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('status', 'confirmed')
    
    if (error) throw error
    return data
  },

  async cancel(id: number) {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}