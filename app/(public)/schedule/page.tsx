// @ts-nocheck
'use client'

import React, { useState, useEffect, useMemo } from 'react'
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

  const { schedules, loading, error, createSchedule, createRecurringSchedule, refetch } = useSchedules()
  const { createReservation } = useReservations()
  
  // スケジュールを日付ごとにグループ化
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    schedules.forEach(schedule => {
      const date = schedule.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(schedule)
    })
    return grouped
  }, [schedules])
  
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

  // LIFF初期化とユーザー情報取得（LIFF専用）
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        console.log('🔄 LIFF環境での初期化開始')
        addDebugLog('LIFF環境での初期化')
        
        if (typeof window.liff !== 'undefined') {
          await window.liff.init({ liffId: '2006887302-Q3erllVJ' })
          
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile()
            setLiffUserId(profile.userId)
            setUserProfile(profile)
            setIsLiffInitialized(true)
            addDebugLog(`LIFF認証成功: ${profile.displayName}`)
          } else {
            // ログインしていない場合はログインを促す
            setLiffError('LINEにログインしてください')
          }
        } else {
          throw new Error('LIFF SDKが読み込まれていません')
        }
        
        console.log('✅ LIFF初期化完了')
      } catch (error) {
        console.error('❌ LIFF初期化エラー:', error)
        addDebugLog(`LIFF初期化エラー: ${error}`)
        setLiffError('LIFF初期化に失敗しました')
      }
    }
    
    // LIFF SDKの読み込み待ち
    const checkLiffReady = () => {
      let attempts = 0
      const maxAttempts = 30

      const intervalId = setInterval(() => {
        attempts++
        
        if (typeof window !== 'undefined' && window.liff && typeof window.liff.init === 'function') {
          clearInterval(intervalId)
          addDebugLog('✅ LIFF SDK読み込み完了')
          initializeLiff()
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          setLiffError('LIFF SDKの読み込みがタイムアウトしました')
        }
      }, 200)
    }

    checkLiffReady()
    
    // テスト関数を追加
    window.testSimpleReservation = async function() {
      console.log('🧪 予約テスト開始...')
      try {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: 1,
            customerNameKanji: 'テスト太郎',
            customerNameKatakana: 'テストタロウ',
            lineId: 'test-line-id',
            phone: '090-1234-5678'
          })
        })
        
        const result = await response.json()
        console.log('🧪 予約テスト結果:', result)
        return result
      } catch (error) {
        console.error('❌ 予約テストエラー:', error)
        return false
      }
    }
    
    window.testGASSync = async function() {
      console.log('🧪 GAS同期テスト開始...')
      try {
        const response = await fetch('/api/gas-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerNameKanji: 'テスト太郎',
            phone: '090-1234-5678',
            programName: 'テストプログラム'
          })
        })
        
        const result = await response.json()
        console.log('🧪 GAS同期テスト結果:', result)
        return result
      } catch (error) {
        console.error('❌ GAS同期テストエラー:', error)
        return false
      }
    }
    
    console.log('📚 利用可能なテスト関数:')
    console.log('- window.testSimpleReservation() : 簡略予約テスト')
    console.log('- window.testGASSync() : GAS同期テスト')
    
    // 元のLIFF初期化コードをコメントアウト
    /*
    const initializeLiff = async () => {
      try {
        addDebugLog('🔄 LIFF初期化開始...')
        
        // 環境変数チェック
        const liffId = '2006887302-Q3erllVJ'
        addDebugLog(`📋 LIFF ID: ${liffId || '未設定'}`)
        addDebugLog(`🌍 環境: production`)
        addDebugLog(`🔧 デバッグモード: false`)
        
        if (!liffId || liffId === 'your_liff_id_here' || liffId === '2000000000-abcdefgh') {
          setLiffError(`❌ LIFF IDが設定されていません。
          
現在のLIFF ID: ${liffId || '未設定'}
環境: production

【Vercel管理者向け】
1. Vercelダッシュボード → Settings → Environment Variables
2. NEXT_PUBLIC_LIFF_ID = 2006887302-Q3erllVJ を追加
3. 再デプロイを実行してください`)
          addDebugLog('❌ LIFF ID未設定エラー')
          return
        }

        // デバッグモード: すべての環境で一時的に有効化（テスト用）
        const isDebugMode = true  // 一時的にすべての環境でデバッグモード有効
        
        console.log('🔍 デバッグモード確認:', {
          hostname: window.location.hostname,
          search: window.location.search,
          nodeEnv: 'production',
          isDebugMode
        })
        
        // LIFF SDKが読み込まれているかチェック（デバッグモードでは無視）
        if (!isDebugMode && (typeof window === 'undefined' || !window.liff)) {
          setLiffError('LIFFアプリでのアクセスが必要です。LINEアプリから再度お試しください。')
          addDebugLog('❌ LIFF SDK未読み込み')
          return
        }
        
        // デバッグモードの場合は LIFF なしで続行
        if (isDebugMode && !window.liff) {
          console.log('🔧 デバッグモード: LIFF なしで動作')
          setIsLiffInitialized(true)
          setLiffUserId('debug-user-id')
          addDebugLog('🔧 デバッグモード有効')
          return
        }

        addDebugLog('✅ LIFF SDK読み込み完了')

        // LIFF初期化（タイムアウト付き）
        const initPromise = window.liff.init({ liffId })
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LIFF初期化タイムアウト')), 15000)
        )

        await Promise.race([initPromise, timeoutPromise])
        setIsLiffInitialized(true)
        addDebugLog('✅ LIFF初期化完了')

        // LIFF環境の詳細確認
        const isInClient = window.liff.isInClient()
        const os = window.liff.getOS()
        const language = window.liff.getLanguage()
        const version = window.liff.getVersion()
        const lineVersion = window.liff.getLineVersion()
        
        addDebugLog(`📱 LIFF環境詳細:`)
        addDebugLog(`  - InClient: ${isInClient}`)
        addDebugLog(`  - OS: ${os}`)
        addDebugLog(`  - Language: ${language}`)
        addDebugLog(`  - LIFF Version: ${version}`)
        addDebugLog(`  - LINE Version: ${lineVersion}`)
        
        // 利用可能なAPI確認（LIFF 2.x対応）
        const checkableApis = [
          'shareTargetPicker',
          'sendMessages', 
          'getFriendship',
          'scanCodeV2'
        ]
        
        const availableApis = checkableApis.filter(api => {
          try {
            return window.liff.isApiAvailable(api)
          } catch (e: any) {
            addDebugLog(`⚠️ API確認エラー (${api}): ${e.message}`)
            return false
          }
        })
        
        addDebugLog(`🔧 利用可能API: ${availableApis.join(', ')}`)
        
        // ログイン状態確認
        if (window.liff.isLoggedIn()) {
          addDebugLog('✅ ログイン済み')
          
          // プロフィール取得（基本API、可用性チェック不要）
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
        // 詳細なエラー情報を収集
        const currentLiffId = '2006887302-Q3erllVJ'
        const errorInfo = {
          message: error.message || 'Unknown error',
          code: error.code || 'No code',
          name: error.name || 'Unknown',
          stack: error.stack || 'No stack trace',
          toString: error.toString(),
          ...error
        }
        
        addDebugLog(`❌ LIFF初期化エラー詳細:`)
        addDebugLog(`  - Message: ${errorInfo.message}`)
        addDebugLog(`  - Code: ${errorInfo.code}`)
        addDebugLog(`  - Name: ${errorInfo.name}`)
        addDebugLog(`  - Full Error: ${JSON.stringify(errorInfo, null, 2)}`)
        
        // エラーコード別の詳細メッセージ
        let detailedErrorMessage = 'LIFFの初期化に失敗しました。'
        
        if (error?.code === 'INVALID_LIFF_ID') {
          detailedErrorMessage = `❌ 無効なLIFF ID エラー

現在のLIFF ID: ${currentLiffId}
このLIFF IDは無効か、設定に問題があります。

【確認事項】
1. LINE Developers ConsoleでLIFF設定を確認
2. LIFF IDが正しくコピーされているか確認
3. LIFFアプリが有効化されているか確認

【Vercel環境変数】
NEXT_PUBLIC_LIFF_ID = ${currentLiffId}`
        } else if (error?.code === 'FORBIDDEN') {
          detailedErrorMessage = `❌ アクセス権限エラー

【原因】
1. 許可されていないドメインからのアクセス
2. LIFF設定のエンドポイントURLが間違っている
3. チャネルの権限設定に問題

【確認事項】
1. LIFF設定のエンドポイントURL: ${window.location.origin}/schedule
2. 正しいLINEアカウントでアクセスしているか
3. チャネルが公開されているか`
        } else if (error.message === 'LIFF初期化タイムアウト') {
          detailedErrorMessage = `❌ LIFF初期化タイムアウト

【原因】
1. ネットワーク接続の問題
2. LINEサーバーの応答遅延
3. LIFFサービスの一時的な問題

【解決方法】
1. ネットワーク接続を確認
2. しばらく待ってから再試行
3. LINEアプリを再起動`
        } else {
          detailedErrorMessage = `❌ 予期しないエラー

エラーコード: ${errorInfo.code}
エラーメッセージ: ${errorInfo.message}

【詳細情報】
${JSON.stringify(errorInfo, null, 2)}

【解決方法】
1. ページを再読み込み
2. LINEアプリを再起動
3. 管理者にエラー情報をお知らせください`
        }
        
        setLiffError(detailedErrorMessage)
      }
    }

    // LIFF SDKの読み込み待ち（強化版デバッグ）
    const checkLiffReady = () => {
      let attempts = 0
      const maxAttempts = 30 // 6秒でタイムアウト（200ms × 30）

      addDebugLog('🚀 LIFF SDK読み込みチェック開始')
      addDebugLog(`🌐 User Agent: ${navigator.userAgent}`)
      addDebugLog(`📱 ページURL: ${window.location.href}`)
      addDebugLog(`🔗 Referrer: ${document.referrer || 'なし'}`)

      const intervalId = setInterval(() => {
        attempts++
        
        // 詳細なチェック情報をログ出力
        const windowExists = typeof window !== 'undefined'
        const liffExists = windowExists && window.liff
        const liffReady = liffExists && typeof window.liff.init === 'function'
        
        addDebugLog(`⏳ 確認 ${attempts}/${maxAttempts}: window=${windowExists}, liff=${liffExists}, ready=${liffReady}`)
        
        // LIFF オブジェクトの詳細チェック
        if (windowExists && window.liff) {
          addDebugLog(`🔧 LIFF オブジェクト詳細: ${Object.keys(window.liff).join(', ')}`)
        }

        if (liffReady) {
          clearInterval(intervalId)
          addDebugLog('✅ LIFF SDK読み込み完了 - 初期化開始')
          initializeLiff()
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId)
          
          // 詳細なエラー情報を収集
          const errorDetails = [
            `🌐 Window存在: ${windowExists}`,
            `📦 LIFF存在: ${liffExists}`,
            `⚙️ LIFF準備完了: ${liffReady}`,
            `🕒 タイムアウト時間: ${maxAttempts * 200}ms`,
            `🔗 アクセス元: ${document.referrer || '直接アクセス'}`,
            `📱 User Agent: ${navigator.userAgent}`,
            `🌍 Location: ${window.location.href}`
          ]
          
          const detailedError = `LIFF SDKの読み込みがタイムアウトしました。

【エラー詳細】
${errorDetails.join('\n')}

【考えられる原因】
1. ネットワーク接続の問題
2. LINEアプリ外からのアクセス
3. LIFF SDKのCDN問題
4. スクリプトブロッカーの影響

【解決方法】
1. LINEアプリから再度アクセス
2. ネットワーク接続を確認
3. ページを再読み込み
4. 管理者にお問い合わせください`

          setLiffError(detailedError)
          addDebugLog('❌ LIFF SDK読み込みタイムアウト')
        }
      }, 200)
    }

    // 緊急対応: LIFF チェックを完全にバイパス
    console.log('🔧 緊急対応: LIFF認証を完全にバイパス')
    setIsLiffInitialized(true)
    setLiffUserId('emergency-bypass-user-id')
    addDebugLog('🔧 緊急バイパスモード有効')
    
    // GAS統合スクリプト自動実行開始（修正版）
    console.log('🚀 GAS統合スクリプト自動実行開始（修正版）')
    
    // 元のfetchを保存
    const originalFetch = window.fetch
    
    // fetch interceptor設定（デバッグ強化版）
    window.fetch = function(...args) {
      const [url, options] = args
      
      console.log('🔍 Fetchリクエスト検出:', url, options?.method)
      
      // 予約API呼び出しを検出
      if (url.includes('/api/reservations') && options?.method === 'POST') {
        console.log('🎯 予約API呼び出し検出:', url)
        console.log('📤 送信データ:', options?.body)
        
        return originalFetch.apply(this, args).then(async response => {
          console.log('📥 予約APIレスポンス:', response.status, response.ok)
          
          if (response.ok) {
            try {
              const responseClone = response.clone()
              const data = await responseClone.json()
              console.log('✅ 予約成功 - データ詳細:', data)
              console.log('🔄 GAS同期開始準備...')
              
              // 予約データからGAS送信用データを構築
              let gasData = {}
              if (options?.body) {
                try {
                  gasData = JSON.parse(options.body)
                  console.log('📋 GAS送信用データ準備:', gasData)
                } catch (e) {
                  console.warn('⚠️ 送信データ解析失敗:', e)
                }
              }
              
              // GAS同期実行
              setTimeout(async () => {
                try {
                  console.log('📡 GAS同期リクエスト開始...')
                  const syncResponse = await originalFetch('/api/gas-sync', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gasData)
                  })
                  
                  console.log('📥 GAS同期レスポンス:', syncResponse.status)
                  
                  if (syncResponse.ok) {
                    const syncData = await syncResponse.json()
                    console.log('✅ GAS同期成功:', syncData)
                  } else {
                    const errorText = await syncResponse.text().catch(() => 'エラー詳細取得失敗')
                    console.warn('⚠️ GAS同期失敗:', {
                      status: syncResponse.status,
                      statusText: syncResponse.statusText,
                      error: errorText
                    })
                  }
                } catch (error) {
                  console.warn('⚠️ GAS同期エラー:', error)
                }
              }, 1000)
              
            } catch (error) {
              console.warn('⚠️ 予約レスポンス処理エラー:', error)
            }
          } else {
            console.error('❌ 予約API失敗:', response.status)
          }
          return response
        })
      }
      
      // その他のリクエストはそのまま処理
      return originalFetch.apply(this, args)
    }
    
    console.log('✅ GAS統合スクリプト実行完了 - 修正版待機中')
    
    // テスト関数
    window.testGASConnection = async function() {
      console.log('🧪 GAS接続テスト開始（修正版）...')
      try {
        const response = await originalFetch('/api/test-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('🧪 テスト結果:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'エラー詳細取得失敗')
          console.error('❌ GAS接続テスト失敗:', {
            status: response.status,
            error: errorText
          })
          return false
        } else {
          const data = await response.json()
          console.log('✅ GAS接続テスト成功!', data)
          return true
        }
      } catch (error) {
        console.error('❌ GAS接続テストエラー:', error)
        return false
      }
    }
    
    console.log('📚 利用可能な関数:')
    console.log('- window.testGASConnection() : GAS接続テスト')
    console.log('✅ 準備完了 - 予約を作成すると自動でGAS同期が実行されます')
    
    */
    // checkLiffReady() をコメントアウト
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
    console.log('🎯 予約処理開始:', data)
    
    try {
      // 予約作成を実行
      const result = await createReservation(data)
      console.log('✅ 予約作成成功:', result)
      
      // スケジュール更新を試行（失敗しても予約成功は維持）
      try {
        await refetch()
        console.log('✅ スケジュール更新成功')
      } catch (refetchError) {
        console.warn('⚠️ スケジュール更新失敗（予約は成功済み）:', refetchError)
        // refetchの失敗は無視（予約自体は成功している）
      }
      
      return result
    } catch (error) {
      console.error('❌ 予約作成失敗:', error)
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
    <div className="container mx-auto p-4 md:p-6">
      {/* LIFFユーザー情報表示（開発時のみ） */}
      {false && (
        <div className="mb-4 p-3 bg-green-100 rounded-md text-sm">
          <div><strong>✅ LIFF認証済み</strong></div>
          <div>ユーザーID: {liffUserId}</div>
          <div>表示名: {userProfile?.displayName || '取得中...'}</div>
          <div>LIFF初期化: {isLiffInitialized ? '✅' : '❌'}</div>
          <div>LINEアプリ内: {typeof window !== 'undefined' && window.liff?.isInClient() ? '✅' : '❌'}</div>
        </div>
      )}

      <WeeklyCalendar
        schedules={schedulesByDate}
        onScheduleClick={handleScheduleClick}
        onAddSchedule={handleAddSchedule}
        showAddButton={false}
        currentWeek={new Date(currentWeekStart)}
        onWeekChange={(week) => setCurrentWeekStart(formatDate(week))}
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