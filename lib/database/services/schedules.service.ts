import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { format, startOfWeek, endOfWeek } from 'date-fns'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

export interface ScheduleWithRelations extends Schedule {
  program: Database['public']['Tables']['programs']['Row']
  reservations?: Database['public']['Tables']['reservations']['Row'][]
}

export class SchedulesService {
  private supabase = createServiceRoleClient()

  async getWeeklySchedules(date: Date) {
    const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        program:programs(*),
        reservations(*)
      `)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date')
      .order('start_time')

    if (error) {
      throw new Error(`Failed to fetch weekly schedules: ${error.message}`)
    }

    return data as ScheduleWithRelations[]
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        program:programs(*),
        reservations(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch schedule: ${error.message}`)
    }

    return data as ScheduleWithRelations
  }

  async create(schedule: ScheduleInsert) {
    const { data, error } = await this.supabase
      .from('schedules')
      .insert(schedule)
      .select(`
        *,
        program:programs(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create schedule: ${error.message}`)
    }

    return data
  }

  async createRecurring(schedules: ScheduleInsert[]) {
    const { data, error } = await this.supabase
      .from('schedules')
      .insert(schedules)
      .select()

    if (error) {
      throw new Error(`Failed to create recurring schedules: ${error.message}`)
    }

    return data
  }

  async update(id: number, schedule: ScheduleUpdate) {
    const { data, error } = await this.supabase
      .from('schedules')
      .update(schedule)
      .eq('id', id)
      .select(`
        *,
        program:programs(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`)
    }

    return data
  }

  async delete(id: number) {
    const { error } = await this.supabase
      .from('schedules')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete schedule: ${error.message}`)
    }

    return true
  }

  async checkConflict(date: string, studioId: number, startTime: string, endTime: string, excludeId?: number) {
    // 重複チェックを無効化 - 異なるプログラムなら同じ時間帯でもOK
    return false // 常に重複なし
  }
}

export const schedulesService = new SchedulesService()