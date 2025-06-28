import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockSchedules } from '@/lib/mock-data'
import { z } from 'zod'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(request: NextRequest) {
  try {
    // URL検索パラメータを直接取得
    const { start } = querySchema.parse({
      start: request.nextUrl.searchParams.get('start'),
    })

    // データベースが利用できない場合のフォールバック
    try {
      const endDate = new Date(start)
      endDate.setDate(endDate.getDate() + 6)

      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: new Date(start),
            lte: endDate,
          },
          is_cancelled: false,
        },
        include: {
          program: true,
          instructor: true,
          studio: true,
          reservations: {
            where: { status: 'confirmed' },
          },
        },
        orderBy: [
          { date: 'asc' },
          { start_time: 'asc' },
        ],
      })

      // 日付別にグループ化
      const groupedSchedules = schedules.reduce((acc, schedule) => {
        const dateKey = schedule.date.toISOString().split('T')[0]
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }

        acc[dateKey].push({
          id: schedule.id,
          time: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`,
          program: schedule.program.name,
          instructor: schedule.instructor.name,
          studio: schedule.studio.name,
          capacity: schedule.capacity,
          booked: schedule.reservations.length,
          color: schedule.program.color_class,
          textColor: schedule.program.text_color_class,
        })

        return acc
      }, {} as Record<string, any[]>)

      return NextResponse.json(groupedSchedules)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      // モックデータを返す
      return NextResponse.json(mockSchedules)
    }
  } catch (error) {
    console.error('週間スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: 'スケジュール取得に失敗しました' },
      { status: 500 }
    )
  }
}