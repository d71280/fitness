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
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  // デバッグログ追加
  const addDebugLog = (message: string) => {
    console.log(`[LIFF DEBUG] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // LIFF初期化とユーザー情報取得（強化版）
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        addDebugLog('🔄 LIFF初期化開始...')
        
        // 環境変数チェック
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        addDebugLog(`📋 LIFF ID: ${liffId || '未設定'}`)
        
        if (!liffId || liffId === '2000000000-abcdefgh') {
          setLiffError('LIFF IDが設定されていません。環境変数 NEXT_PUBLIC_LIFF_ID を設定してください。')
          addDebugLog('❌ LIFF ID未設定エラー')
          return
        }

        // LIFF SDKが読み込まれているかチェック
        if (typeof window === 'undefined' || !window.liff) {
          setLiffError('LIFFアプリでのアクセスが必要です。LINEアプリから再度お試しください。')
          addDebugLog('❌ LIFF SDK未読み込み')
          return
        }

        addDebugLog('✅ LIFF SDK読み込み完了')

        // LIFF初期化（タイムアウト付き）
        const initPromise = window.liff.init({ liffId })
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LIFF初期化タイムアウト')), 10000)
        )

        await Promise.race([initPromise, timeoutPromise])
        setIsLiffInitialized(true)
        addDebugLog('✅ LIFF初期化完了')

        // LIFF環境の確認
        const isInClient = window.liff.isInClient()
        const os = window.liff.getOS()
        const language = window.liff.getLanguage()
        addDebugLog(`📱 LIFF環境: InClient=${isInClient}, OS=${os}, Language=${language}`)
        
        // ログイン状態確認
        if (window.liff.isLoggedIn()) {
          addDebugLog('✅ ログイン済み')
          
          // プロフィール取得API可用性チェック
          if (window.liff.isApiAvailable('getProfile')) {
            try {
              const profile = await window.liff.getProfile()
              addDebugLog(`👤 ユーザープロフィール取得成功: ${profile.displayName}`)
              setLiffUserId(profile.userId)
              setUserProfile(profile)
            } catch (profileError: any) {
              addDebugLog(`❌ プロフィール取得エラー: ${profileError.message}`)
              setLiffError('ユーザー情報の取得に失敗しました。再度お試しください。')
            }
          } else {
            addDebugLog('❌ getProfile API が利用できません')
            setLiffError('この環境では一部機能が制限されています。')
          }
        } else {
          addDebugLog('❌ ログインが必要です')
          
          // LINEアプリ内の場合は自動ログイン
          if (isInClient) {
            try {
              addDebugLog('🔄 自動ログイン実行中...')
              await window.liff.login()
            } catch (loginError: any) {
              addDebugLog(`❌ 自動ログインエラー: ${loginError.message}`)
              setLiffError('LINEログインに失敗しました。アプリを再起動してお試しください。')
            }
          } else {
            setLiffError('LINEアプリからアクセスしてください。外部ブラウザでは一部機能が制限されます。')
            addDebugLog('❌ 外部ブラウザアクセス')
          }
        }
      } catch (error: any) {
        addDebugLog(`❌ LIFF初期化エラー: ${error.message}`)
        if (error?.code === 'INVALID_LIFF_ID') {
          setLiffError('LIFF設定エラー：管理者にお問い合わせください。')
        } else if (error?.code === 'FORBIDDEN') {
          setLiffError('アクセス権限がありません。正しいリンクからアクセスしてください。')
        } else if (error.message === 'LIFF初期化タイムアウト') {
          setLiffError('LIFF初期化がタイムアウトしました。ネットワークを確認して再度お試しください。')
        } else {
          setLiffError(`LIFFの初期化に失敗しました: ${error.message}`)
        }
      }
    }

    // LIFF SDKの読み込み待ち（タイムアウト付き）
    const checkLiffReady = () => {
      let attempts = 0
      const maxAttempts = 25 // 5秒でタイムアウト

      const intervalId = setInterval(() => {
        attempts++
        addDebugLog(`⏳ LIFF SDK読み込み確認 (${attempts}/${maxAttempts})`)

        if (typeof window !== 'undefined' && window.liff) {
          clearInterval(intervalId)
          initializeLiff()
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          setLiffError('LIFF SDKの読み込みに失敗しました。ページを再読み込みしてください。')
          addDebugLog('❌ LIFF SDK読み込みタイムアウト')
        }
      }, 200)
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-lg mb-4">LINE認証を確認中...</div>
        <div className="text-sm text-gray-500 mb-6">LIFF SDKを読み込んでいます</div>
        
        {/* デバッグ情報表示 */}
        <div className="w-full max-w-md bg-gray-100 p-4 rounded-lg text-xs">
          <div className="font-bold mb-2">🔧 デバッグ情報:</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {debugInfo.map((log, index) => (
              <div key={index} className="text-gray-600">{log}</div>
            ))}
          </div>
        </div>
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
          
          {/* デバッグ情報表示 */}
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-gray-500">🔧 詳細なデバッグ情報を表示</summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs max-h-40 overflow-y-auto">
              {debugInfo.map((log, index) => (
                <div key={index} className="text-gray-600">{log}</div>
              ))}
            </div>
          </details>
          
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