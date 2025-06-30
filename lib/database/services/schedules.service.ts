import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { format, startOfWeek, endOfWeek } from 'date-fns'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

export interface ScheduleWithRelations extends Schedule {
  program: Database['public']['Tables']['programs']['Row']
  instructor: Database['public']['Tables']['instructors']['Row']
  studio: Database['public']['Tables']['studios']['Row']
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
        instructor:instructors(*),
        studio:studios(*),
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
        instructor:instructors(*),
        studio:studios(*),
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
        program:programs(*),
        instructor:instructors(*),
        studio:studios(*)
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
        program:programs(*),
        instructor:instructors(*),
        studio:studios(*)
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
    let query = this.supabase
      .from('schedules')
      .select('id, program_id, start_time, end_time')
      .eq('date', date)
      .eq('studio_id', studioId)
      .eq('is_cancelled', false)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to check schedule conflict: ${error.message}`)
    }

    // 時間の重複チェック（プログラムが異なる場合は競合しない）
    for (const schedule of data || []) {
      const existingStart = schedule.start_time
      const existingEnd = schedule.end_time

      // 時間の重複を確認
      const timeOverlap = (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      )

      // 時間が重複している場合のみ競合として扱う
      // 注意: 異なるプログラムでも同じスタジオで同じ時間は物理的に不可能なので競合とする
      if (timeOverlap) {
        return true // 重複あり
      }
    }

    return false // 重複なし
  }
}

export const schedulesService = new SchedulesService()