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

  // LIFF初期化とユーザー情報取得（必須）
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDKが読み込まれているかチェック
        if (typeof window === 'undefined' || !window.liff) {
          setLiffError('このページはLINEアプリ内でのみご利用いただけます。LINEから再度アクセスしてください。')
          return
        }

        console.log('🔄 LIFF初期化開始...')
        
        // LIFF_IDは環境変数で設定（環境変数がない場合はダミー値）
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2000000000-abcdefgh'
        
        await window.liff.init({ liffId })
        setIsLiffInitialized(true)
        console.log('✅ LIFF初期化完了')
        
        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          console.log('👤 LIFFユーザー情報取得:', profile)
          setLiffUserId(profile.userId)
        } else {
          console.log('❌ LIFFログインが必要です')
          setLiffError('LINEへのログインが必要です。ログインしてから再度お試しください。')
          // 自動ログインプロンプト
          window.liff.login()
        }
      } catch (error) {
        console.error('❌ LIFF初期化エラー:', error)
        setLiffError('LIFFの初期化に失敗しました。LINEアプリから再度アクセスしてください。')
      }
    }

    // 少し遅延させてLIFF SDKの読み込みを待つ
    setTimeout(initializeLiff, 500)
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
        <div className="text-lg mb-4">LINE認証を確認中...</div>
        <div className="text-sm text-gray-500">少々お待ちください</div>
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
              <li>提供されたリンクから再度アクセス</li>
              <li>LINE内ブラウザでページを開く</li>
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
          <div>LIFF初期化: {isLiffInitialized ? '✅' : '❌'}</div>
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