// @ts-nocheck
'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, User, MessageCircle, Home } from 'lucide-react'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const [liffProfile, setLiffProfile] = useState<any>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  
  // URLパラメータから予約情報を取得
  const reservationId = searchParams.get('id')
  const programName = searchParams.get('program')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const customerName = searchParams.get('name')
  
  useEffect(() => {
    // LIFF初期化と認証状態確認
    const initializeLiff = async () => {
      try {
        if (window.liff) {
          await window.liff.init({ 
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' 
          })
          
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile()
            setLiffProfile(profile)
          }
          
          setIsLiffInitialized(true)
        }
      } catch (error) {
        console.error('LIFF初期化エラー:', error)
        setIsLiffInitialized(true)
      }
    }
    
    initializeLiff()
  }, [])
  
  // 日付フォーマット
  const formatDateJp = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 成功アイコン */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">予約が完了しました！</h1>
        </div>
        
        {/* 予約詳細カード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">予約内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservationId && (
              <div className="text-sm text-gray-600">
                予約番号: <span className="font-mono">{reservationId}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">{formatDateJp(date)}</div>
                  <div className="text-sm text-gray-600">{programName || 'プログラム'}</div>
                </div>
              </div>
              
              {time && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div className="text-sm">{time}</div>
                </div>
              )}
              
              {customerName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="text-sm">{customerName} 様</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* LINE通知の説明 */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">
                  LINEに確認メッセージをお送りしました
                </p>
                <p className="text-sm text-green-700">
                  予約詳細とキャンセル方法をご確認ください。
                  レッスン前日にはリマインダーも配信されます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 注意事項 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">ご予約にあたって</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• キャンセルは前日までにLINEでご連絡ください</li>
            <li>• 当日は開始10分前までにお越しください</li>
            <li>• 動きやすい服装でお越しください</li>
          </ul>
        </div>
        
        {/* アクションボタン */}
        <div className="space-y-3">
          {/* メインCTA: 外部LIFFアプリへ */}
          <Button
            className="w-full"
            variant="default"
            size="lg"
            onClick={() => {
              const targetUrl = 'https://liff.line.me/2006887302-vbBy55Qj/landing'
              const params = new URLSearchParams({
                follow: '@080larlo',
                lp: 'tWteWL',
                liff_id: '2006887302-vbBy55Qj',
                // 予約情報も渡す
                from_booking: 'true',
                reservation_id: reservationId || ''
              })
              
              if (window.liff && window.liff.isInClient()) {
                // LIFF環境内で開く
                window.liff.openWindow({
                  url: `${targetUrl}?${params.toString()}`,
                  external: false
                })
              } else {
                // 通常のブラウザで開く
                window.location.href = `${targetUrl}?${params.toString()}`
              }
            }}
          >
            次へ進む
          </Button>
          
          <Link href="/schedule" className="block">
            <Button className="w-full" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              スケジュールに戻る
            </Button>
          </Link>
          
          {liffProfile && (
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                if (window.liff && window.liff.isInClient()) {
                  window.liff.closeWindow()
                }
              }}
            >
              LINEアプリを閉じる
            </Button>
          )}
        </div>
        
        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono">
            <div>LIFF初期化: {isLiffInitialized ? '完了' : '未完了'}</div>
            <div>LIFFユーザー: {liffProfile?.userId || '未認証'}</div>
            <div>予約ID: {reservationId || 'なし'}</div>
          </div>
        )}
      </div>
    </div>
  )
}