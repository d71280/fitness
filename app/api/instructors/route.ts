import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockInstructors } from '@/lib/mock-data'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    try {
      const instructors = await prisma.instructor.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(instructors)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockInstructors)
    }
  } catch (error) {
    console.error('インストラクター取得エラー:', error)
    return NextResponse.json(
      { error: 'インストラクター取得に失敗しました' },
      { status: 500 }
    )
  }
}