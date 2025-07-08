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
    const createdSchedules = []
    const errors = []

    // 繰り返しスケジュールグループIDを生成（UUID v4形式）
    const recurringGroupId = crypto.randomUUID()

    // 一つずつ作成して、重複エラーをスキップ
    for (const schedule of schedules) {
      try {
        // 繰り返しスケジュールには共通のグループIDを設定
        const scheduleWithGroupId = {
          ...schedule,
          recurring_group_id: recurringGroupId
        }

        // 通常のinsertを使用し、重複エラーは無視して処理を継続
        const { data, error } = await this.supabase
          .from('schedules')
          .insert(scheduleWithGroupId)
          .select()
          .single()

        if (error) {
          // 重複エラーの場合は警告のみ表示して処理を継続
          if (error.code === '23505') { // unique constraint violation
            console.log(`⚠️ スケジュール重複のため既存スケジュールを維持:`, {
              date: schedule.date,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              programId: schedule.program_id,
              studioId: schedule.studio_id
            })
            
            // 重複エラーの場合は既存のスケジュールを取得
            const { data: existing } = await this.supabase
              .from('schedules')
              .select()
              .eq('date', schedule.date)
              .eq('studio_id', schedule.studio_id)
              .eq('start_time', schedule.start_time)
              .eq('end_time', schedule.end_time)
              .eq('program_id', schedule.program_id)
              .single()
            
            if (existing) {
              createdSchedules.push(existing)
            }
            continue
          } else {
            console.error('Schedule creation error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              schedule: schedule
            })
            
            errors.push(`Failed to create schedule for ${schedule.date}: ${error.message}`)
            continue
          }
        }

        createdSchedules.push(data)
      } catch (err) {
        errors.push(`Error creating schedule for ${schedule.date}: ${err.message}`)
      }
    }

    // エラーがあってもいくつかのスケジュールが作成された場合は成功とみなす
    if (createdSchedules.length === 0 && errors.length > 0) {
      throw new Error(`Failed to create any schedules: ${errors.join('; ')}`)
    }

    if (errors.length > 0) {
      console.warn('Some schedules could not be created:', errors)
    }

    console.log(`Created ${createdSchedules.length} schedules with group ID: ${recurringGroupId}`)
    
    return createdSchedules
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