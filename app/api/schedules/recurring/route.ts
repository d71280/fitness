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
    const data = createRecurringScheduleSchema.parse(body)

    const schedules = []
    const baseDate = new Date(data.baseDate)

    for (let week = 0; week < data.repeatWeeks; week++) {
      for (const dayOfWeek of data.daysOfWeek) {
        const scheduleDate = new Date(baseDate)
        scheduleDate.setDate(baseDate.getDate() + (week * 7) + (dayOfWeek - baseDate.getDay()))

        schedules.push({
          date: scheduleDate.toISOString().split('T')[0],
          start_time: data.startTime,
          end_time: data.endTime,
          program_id: data.programId,
          instructor_id: data.instructorId || 1, // デフォルトインストラクター
          studio_id: 1,
          capacity: data.capacity,
        })
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
    }, { status: 201 })
  } catch (error) {
    console.error('Recurring schedule creation error:', error)
    
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
      { error: errorMessage },
      { status: 500 }
    )
  }
}