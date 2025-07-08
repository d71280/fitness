import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

const createScheduleSchema = z.object({
  baseDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  programId: z.number(),
  capacity: z.number().min(1).max(100),
  instructorId: z.number().optional(),
  studioId: z.number().optional(),
})

// スケジュール一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        program:programs(*),
        reservations(
          *,
          customer:customers(*)
        )
      `)
      .eq('is_cancelled', false)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error

    // 確定済み予約のみをカウントして整形、キャメルケースに変換
    const formattedSchedules = schedules.map(schedule => {
      const confirmedReservations = schedule.reservations?.filter(
        (reservation: any) => reservation.status === 'confirmed'
      ) || []
      
      return {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        programId: schedule.program_id,
        capacity: schedule.capacity,
        program: schedule.program,
        currentBookings: confirmedReservations.length,
        availableSlots: schedule.capacity - confirmedReservations.length,
        reservations: confirmedReservations,
        recurringGroupId: schedule.recurring_group_id,
        recurringType: schedule.recurring_type || 'none',
        recurringEndDate: schedule.recurring_end_date,
        recurringCount: schedule.recurring_count,
        bookedCount: confirmedReservations.length
      }
    })

    return NextResponse.json(formattedSchedules)
  } catch (error) {
    console.error('スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: 'スケジュール取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 新規スケジュール作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createScheduleSchema.parse(body)

    try {
      const supabase = createServiceRoleClient()
      
      // upsertを使用して既存のスケジュールがあれば更新、なければ挿入
      const { data: schedule, error } = await supabase
        .from('schedules')
        .upsert({
          date: data.baseDate,
          start_time: data.startTime,
          end_time: data.endTime,
          program_id: data.programId,
          capacity: data.capacity,
          instructor_id: data.instructorId || 1, // デフォルトインストラクター
          studio_id: data.studioId || 1, // デフォルトスタジオ
        }, {
          onConflict: 'date,studio_id,start_time,end_time'
        })
        .select(`
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        `)
        .single()

      if (error) throw error

      // キャメルケースに変換してレスポンス
      const formattedSchedule = {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        programId: schedule.program_id,
        capacity: schedule.capacity,
        program: schedule.program,
      }

      return NextResponse.json({
        success: true,
        schedule: formattedSchedule,
      }, { status: 201 })
    } catch (dbError) {
      console.error('データベース接続エラー:', dbError)
      
      // 実際のエラーを返す
      return NextResponse.json({
        success: false,
        error: 'データベース接続に失敗しました',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error('スケジュール作成エラー:', error)
    return NextResponse.json(
      { error: 'スケジュール作成に失敗しました' },
      { status: 500 }
    )
  }
}