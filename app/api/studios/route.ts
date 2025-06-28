import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockStudios } from '@/lib/mock-data'

export async function GET() {
  try {
    try {
      const studios = await prisma.studio.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(studios)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockStudios)
    }
  } catch (error) {
    console.error('スタジオ取得エラー:', error)
    return NextResponse.json(
      { error: 'スタジオ取得に失敗しました' },
      { status: 500 }
    )
  }
}