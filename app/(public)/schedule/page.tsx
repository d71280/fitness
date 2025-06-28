'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { AddScheduleModal } from '@/components/schedule/add-schedule-modal'
import { BookingModal } from '@/components/booking/booking-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { useReservations } from '@/hooks/useReservations'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateScheduleData, CreateReservationData } from '@/types/api'

// LIFF型定義
declare global {
  interface Window {
    liff: any
  }
}

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    formatDate(getWeekStart(new Date()))
  )

  const { schedules, loading, error, addSchedule, addRecurringSchedule, refetch } = useSchedules(currentWeekStart)
  const { createReservation } = useReservations()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [liffUserId, setLiffUserId] = useState<string | null>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  // LIFF初期化とユーザー情報取得（公式ドキュメント準拠）
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDKが読み込まれているかチェック
        if (typeof window === 'undefined' || !window.liff) {
          setLiffError('このページはLINEアプリ内でのみご利用いただけます。LINEから再度アクセスしてください。')
          return
        }

        console.log('🔄 LIFF初期化開始...')
        
        // LIFF_IDの取得（環境変数または開発用デフォルト）
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2000000000-abcdefgh'
        console.log('📋 LIFF ID:', liffId)
        
        // LIFF初期化
        await window.liff.init({ liffId })
        setIsLiffInitialized(true)
        console.log('✅ LIFF初期化完了')

        // LIFF環境の確認
        const isInClient = window.liff.isInClient()
        const os = window.liff.getOS()
        const language = window.liff.getLanguage()
        console.log('📱 LIFF環境:', { isInClient, os, language })
        
        // ログイン状態確認
        if (window.liff.isLoggedIn()) {
          console.log('✅ ログイン済み')
          
          // プロフィール取得API可用性チェック
          if (window.liff.isApiAvailable('getProfile')) {
            try {
              const profile = await window.liff.getProfile()
              console.log('👤 ユーザープロフィール取得成功:', {
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl
              })
              setLiffUserId(profile.userId)
              setUserProfile(profile)
            } catch (profileError) {
              console.error('❌ プロフィール取得エラー:', profileError)
              setLiffError('ユーザー情報の取得に失敗しました。再度お試しください。')
            }
          } else {
            console.error('❌ getProfile API が利用できません')
            setLiffError('この環境では一部機能が制限されています。')
          }
        } else {
          console.log('❌ ログインが必要です')
          
          // LINEアプリ内の場合は自動ログイン
          if (isInClient) {
            try {
              await window.liff.login()
            } catch (loginError) {
              console.error('❌ 自動ログインエラー:', loginError)
              setLiffError('LINEログインに失敗しました。アプリを再起動してお試しください。')
            }
          } else {
            setLiffError('LINEアプリからアクセスしてください。外部ブラウザでは一部機能が制限されます。')
          }
        }
      } catch (error: any) {
        console.error('❌ LIFF初期化エラー:', error)
        if (error?.code === 'INVALID_LIFF_ID') {
          setLiffError('LIFF設定エラー：管理者にお問い合わせください。')
        } else if (error?.code === 'FORBIDDEN') {
          setLiffError('アクセス権限がありません。正しいリンクからアクセスしてください。')
        } else {
          setLiffError('LIFFの初期化に失敗しました。LINEアプリから再度アクセスしてください。')
        }
      }
    }

    // LIFF SDKの読み込み待ち
    const checkLiffReady = () => {
      if (typeof window !== 'undefined' && window.liff) {
        initializeLiff()
      } else {
        console.log('⏳ LIFF SDK読み込み待ち...')
        setTimeout(checkLiffReady, 200)
      }
    }

    checkLiffReady()
  }, [])

  const handleAddSchedule = (date: string) => {
    setSelectedDate(date)
    setIsAddModalOpen(true)
  }

  const handleScheduleClick = (schedule: Schedule) => {
    if (!liffUserId) {
      alert('LINE認証が必要です。ページを再読み込みしてください。')
      return
    }
    setSelectedSchedule(schedule)
    setIsBookingModalOpen(true)
  }

  const handleSubmitSchedule = async (data: CreateScheduleData) => {
    try {
      if (data.repeat === 'none') {
        await addSchedule(data)
      } else {
        await addRecurringSchedule(data)
      }
      await refetch()
    } catch (error) {
      throw error
    }
  }

  const handleSubmitReservation = async (data: CreateReservationData) => {
    try {
      await createReservation(data)
      await refetch() // スケジュールを再取得して空き状況を更新
    } catch (error) {
      throw error
    }
  }

  // LIFF初期化中の表示
  if (!isLiffInitialized && !liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-lg mb-4">LINE認証を確認中...</div>
        <div className="text-sm text-gray-500">LIFF SDKを読み込んでいます</div>
      </div>
    )
  }

  // LIFFエラーの表示
  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-xl font-bold text-red-600 mb-4">アクセスエラー</h1>
          <p className="text-gray-700 mb-6">{liffError}</p>
          <div className="text-sm text-gray-500">
            <p className="mb-2"><strong>解決方法：</strong></p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>LINEアプリを開く</li>
              <li>提供されたLIFFリンクから再度アクセス</li>
              <li>LINE内ブラウザでページを開く</li>
              <li>問題が続く場合は管理者にお問い合わせください</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // LINE IDが取得できていない場合
  if (!liffUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-yellow-600 mb-4">認証が必要です</h1>
          <p className="text-gray-700 mb-6">
            LINEアカウントでの認証が完了していません。
            ログインしてから再度お試しください。
          </p>
          <button
            onClick={() => window.liff?.login()}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            LINEでログイン
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">スケジュールを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* LIFFユーザー情報表示（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-green-100 rounded-md text-sm">
          <div><strong>✅ LIFF認証済み</strong></div>
          <div>ユーザーID: {liffUserId}</div>
          <div>表示名: {userProfile?.displayName || '取得中...'}</div>
          <div>LIFF初期化: {isLiffInitialized ? '✅' : '❌'}</div>
          <div>LINEアプリ内: {typeof window !== 'undefined' && window.liff?.isInClient() ? '✅' : '❌'}</div>
        </div>
      )}

      <WeeklyCalendar
        schedules={schedules}
        onScheduleClick={handleScheduleClick}
        showAddButton={false}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setSelectedSchedule(null)
        }}
        schedule={selectedSchedule}
        onSubmit={handleSubmitReservation}
        liffUserId={liffUserId}
      />
    </div>
  )
}