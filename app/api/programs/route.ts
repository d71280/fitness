import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mockPrograms } from '@/lib/mock-data'
import { z } from 'zod'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

const createProgramSchema = z.object({
  name: z.string().min(1, 'プログラム名は必須です'),
  description: z.string().optional(),
  default_duration: z.number().min(15).max(180),
  color_class: z.string(),
  text_color_class: z.string()
})

const updateProgramSchema = createProgramSchema.extend({
  id: z.number()
})

export async function GET() {
  try {
    try {
      const supabase = createServiceRoleClient()
      
      const { data: programs, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProgramSchema.parse(body)
    
    const supabase = createServiceRoleClient()
    
    const { data: program, error } = await supabase
      .from('programs')
      .insert([{
        ...validatedData,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      message: 'プログラムが作成されました', 
      program 
    }, { status: 201 })
    
  } catch (error) {
    console.error('プログラム作成エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'プログラム作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateProgramSchema.parse(body)
    
    const { id, ...updateData } = validatedData
    
    const supabase = createServiceRoleClient()
    
    const { data: program, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      message: 'プログラムが更新されました', 
      program 
    })
    
  } catch (error) {
    console.error('プログラム更新エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'プログラム更新に失敗しました' },
      { status: 500 }
    )
  }
}