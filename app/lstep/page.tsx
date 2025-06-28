'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Lステップリンクからのリダイレクト用ページ
export default function LstepRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // シンプルなLINE ID検出とリダイレクト
    const lineId = searchParams.get('line_id') || 
                   searchParams.get('lineId') || 
                   searchParams.get('uid') || 
                   searchParams.get('user_id') || 
                   searchParams.get('userId')
    
    // 基本的なスケジュールページにリダイレクト
    const redirectUrl = lineId ? `/schedule?line_id=${encodeURIComponent(lineId)}` : '/schedule'
    
    // 短時間待機後にリダイレクト（UX向上）
    setTimeout(() => {
      router.replace(redirectUrl)
    }, 500)
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">スケジュールページに移動中...</p>
      </div>
    </div>
  )
}