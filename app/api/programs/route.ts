import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockPrograms } from '@/lib/mock-data'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    try {
      const programs = await prisma.program.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(programs)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockPrograms)
    }
  } catch (error) {
    console.error('プログラム取得エラー:', error)
    return NextResponse.json(
      { error: 'プログラム取得に失敗しました' },
      { status: 500 }
    )
  }
}