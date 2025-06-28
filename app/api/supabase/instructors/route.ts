import { NextRequest, NextResponse } from 'next/server'
import { instructorsService } from '@/lib/database/supabase-client'

export async function GET() {
  try {
    const instructors = await instructorsService.getAll()
    return NextResponse.json(instructors)
  } catch (error) {
    console.error('インストラクター取得エラー:', error)
    return NextResponse.json(
      { error: 'インストラクターの取得に失敗しました' },
      { status: 500 }
    )
  }
}