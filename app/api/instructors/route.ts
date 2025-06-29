import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mockInstructors } from '@/lib/mock-data'
import { z } from 'zod'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

const createInstructorSchema = z.object({
  name: z.string().min(1, 'インストラクター名は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional()
})

const updateInstructorSchema = createInstructorSchema.extend({
  id: z.number()
})

export async function GET() {
  try {
    try {
      const supabase = createServiceRoleClient()
      
      const { data: instructors, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createInstructorSchema.parse(body)
    
    const supabase = createServiceRoleClient()
    
    const { data: instructor, error } = await supabase
      .from('instructors')
      .insert([{
        ...validatedData,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        bio: validatedData.bio || null,
        specialties: validatedData.specialties || [],
        is_active: true
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      message: 'インストラクターが作成されました', 
      instructor 
    }, { status: 201 })
    
  } catch (error) {
    console.error('インストラクター作成エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'インストラクター作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateInstructorSchema.parse(body)
    
    const { id, ...updateData } = validatedData
    
    const supabase = createServiceRoleClient()
    
    const { data: instructor, error } = await supabase
      .from('instructors')
      .update({
        ...updateData,
        email: updateData.email || null,
        phone: updateData.phone || null,
        bio: updateData.bio || null,
        specialties: updateData.specialties || []
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      message: 'インストラクターが更新されました', 
      instructor 
    })
    
  } catch (error) {
    console.error('インストラクター更新エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'インストラクター更新に失敗しました' },
      { status: 500 }
    )
  }
}