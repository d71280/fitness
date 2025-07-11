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
  const [countdown, setCountdown] = useState(3) // 3秒カウントダウン
  
  // URLパラメータから予約情報を取得
  const reservationId = searchParams.get('id')
  const programName = searchParams.get('program')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const customerName = searchParams.get('name')
  
  // 自動リダイレクト処理
  const performRedirect = async () => {
    const targetUrl = 'https://liff.line.me/2006887302-vbBy55Qj/landing?follow=%40080larlo&lp=tWteWL&liff_id=2006887302-vbBy55Qj'
    
    try {
      if (window.liff && window.liff.isInClient()) {
        console.log('🔗 LIFF環境でのリダイレクト開始')
        await window.liff.openWindow({
          url: targetUrl,
          external: false
        })
      } else {
        console.log('🔗 ブラウザでのリダイレクト開始')
        window.location.href = targetUrl
      }
    } catch (liffError) {
      console.error('🚨 LIFFリダイレクトエラー:', liffError)
      // LIFFエラーの場合は通常のブラウザリダイレクトにフォールバック
      console.log('🔄 通常のブラウザリダイレクトにフォールバック')
      window.location.href = targetUrl
    }
  }
  
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
  
  // カウントダウンと自動リダイレクト
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // カウントダウン終了後にリダイレクト
      performRedirect()
    }
  }, [countdown])
  
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
        
        {/* 自動リダイレクト通知 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm font-medium text-blue-900 mb-2">
            {countdown}秒後に自動的にページが切り替わります
          </p>
          <div className="flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < (3 - countdown) ? 'bg-blue-600' : 'bg-blue-300'
                }`}
              />
            ))}
          </div>
        </div>
        
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
          {/* メインCTA: 外部LIFFアプリへ（すぐに移動） */}
          <Button
            className="w-full"
            variant="default"
            size="lg"
            onClick={() => {
              setCountdown(0) // カウントダウンを0にして即座にリダイレクト
            }}
          >
            今すぐ次へ進む
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