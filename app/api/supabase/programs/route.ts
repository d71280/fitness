import { NextRequest, NextResponse } from 'next/server'
import { programsService } from '@/lib/database/supabase-client'

export async function GET() {
  try {
    const programs = await programsService.getAll()
    return NextResponse.json(programs)
  } catch (error) {
    console.error('プログラム取得エラー:', error)
    return NextResponse.json(
      { error: 'プログラムの取得に失敗しました' },
      { status: 500 }
    )
  }
}