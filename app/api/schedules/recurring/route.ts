// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { schedulesService } from '@/lib/database/services'

const createRecurringScheduleSchema = z.object({
  baseDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  programId: z.number(),
  instructorId: z.number().optional(),
  capacity: z.number(),
  repeatWeeks: z.number().min(1).max(52),
  daysOfWeek: z.array(z.number().min(0).max(6)),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 受信したリクエストデータ:', body)
    const data = createRecurringScheduleSchema.parse(body)
    
    console.log('🔄 繰り返しスケジュール作成開始:', {
      baseDate: data.baseDate,
      repeatWeeks: data.repeatWeeks,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      programId: data.programId
    })

    const schedules = []
    const baseDate = new Date(data.baseDate)

    for (let week = 0; week < data.repeatWeeks; week++) {
      for (const dayOfWeek of data.daysOfWeek) {
        const scheduleDate = new Date(baseDate)
        
        // より正確な日付計算：baseDate から週数分進めて指定した曜日に設定
        scheduleDate.setDate(baseDate.getDate() + (week * 7))
        
        // 指定した曜日に調整（0=日曜、1=月曜...6=土曜）
        const currentDayOfWeek = scheduleDate.getDay()
        const dayDifference = dayOfWeek - currentDayOfWeek
        scheduleDate.setDate(scheduleDate.getDate() + dayDifference)

        const scheduleData = {
          date: scheduleDate.toISOString().split('T')[0],
          start_time: data.startTime,
          end_time: data.endTime,
          program_id: data.programId,
          instructor_id: data.instructorId || 1, // デフォルトインストラクター
          studio_id: 1,
          capacity: data.capacity,
        }
        
        console.log(`📅 スケジュール生成 - 週${week + 1}, 曜日${dayOfWeek}(${['日','月','火','水','木','金','土'][dayOfWeek]}): ${scheduleData.date}, programId: ${scheduleData.program_id}`)
        schedules.push(scheduleData)
      }
    }

    const createdSchedules = await schedulesService.createRecurring(schedules)
    
    // キャメルケースに変換
    const formattedSchedules = createdSchedules.map(schedule => ({
      id: schedule.id,
      date: schedule.date,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      programId: schedule.program_id,
      capacity: schedule.capacity,
      program: schedule.program,
    }))
    
    return NextResponse.json({
      success: true,
      schedules: formattedSchedules,
      count: formattedSchedules.length,
      message: `${formattedSchedules.length}個のスケジュールを作成しました（重複は自動的にスキップされました）`,
    }, { status: 201 })
  } catch (error) {
    console.error('Recurring schedule creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      error: error
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create recurring schedules'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}