import { NextRequest, NextResponse } from 'next/server'
import { schedulesService } from '@/lib/database/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDateとendDateが必要です' },
        { status: 400 }
      )
    }

    const schedules = await schedulesService.getWeeklySchedules(startDate, endDate)
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: 'スケジュールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const schedule = await schedulesService.create(body)
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('スケジュール作成エラー:', error)
    return NextResponse.json(
      { error: 'スケジュールの作成に失敗しました' },
      { status: 500 }
    )
  }
}