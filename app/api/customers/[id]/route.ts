import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  phone: z.string().optional(),
})

// 顧客情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateCustomerSchema.parse(body)
    const customerId = parseInt(params.id)

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: '無効な顧客IDです' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('顧客更新エラー:', error)
      return NextResponse.json(
        { error: '顧客情報の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('顧客更新エラー:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '顧客情報の更新に失敗しました' },
      { status: 500 }
    )
  }
} 