'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreateReservationData, Reservation } from '@/types/api'
import { createClient } from '@/utils/supabase/client'

// 予約完了時の自動同期：手動ボタンと同じAPIを使用

export function useReservations() {
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      console.log('useReservations - 予約データ取得開始')
      
      const response = await fetch('/api/reservations')
      console.log('useReservations - レスポンス:', { status: response.status, ok: response.ok })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('useReservations - APIエラー:', errorData)
        throw new Error(errorData.details || errorData.error || '予約取得に失敗しました')
      }
      
      const data = await response.json()
      console.log('useReservations - 取得成功:', data?.length || 0, '件')
      
      setReservations(data)
      setError(null)
    } catch (err) {
      console.error('useReservations - エラー:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const debugReservationAuth = async () => {
    try {
      console.log('🔍 デバッグAPI呼び出し開始')
      
      // Google OAuthトークンを取得（複数の方法を試行）
      let providerToken = ''
      let tokenSource = 'none'
      
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
          providerToken = session.provider_token
          tokenSource = 'supabase-session'
        }
      } catch (sessionError) {
        console.warn('🔥 Supabaseセッション取得失敗:', sessionError)
      }

      // Supabaseセッションからトークンが取得できない場合、localStorageを試行
      if (!providerToken) {
        try {
          const settings = JSON.parse(localStorage.getItem('fitness-app-settings') || '{}')
          if (settings.oauthToken) {
            providerToken = settings.oauthToken
            tokenSource = 'localStorage'
          }
        } catch (storageError) {
          console.warn('🔥 localStorage設定取得失敗:', storageError)
        }
      }

      // ウィンドウオブジェクトからの取得も試行
      if (!providerToken && typeof window !== 'undefined' && (window as any).fitnessAppSettings?.oauthToken) {
        providerToken = (window as any).fitnessAppSettings.oauthToken
        tokenSource = 'window-object'
      }

      console.log('🔍 デバッグAPI用トークン情報:', {
        hasProviderToken: !!providerToken,
        tokenLength: providerToken?.length,
        tokenSource: tokenSource
      })

      const response = await fetch('/api/debug-reservation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Provider-Token': providerToken || '',
        },
        body: JSON.stringify({ debug: true }),
      })

      const result = await response.json()
      console.log('🔍 デバッグAPI結果:', result)
      return result
      
    } catch (error) {
      console.error('🔍 デバッグAPIエラー:', error)
      throw error
    }
  }

  const createReservation = async (data: CreateReservationData) => {
    try {
      setLoading(true)
      console.log('🎯 予約作成開始:', data)
      
      // タイムアウト設定付きのAbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log('⏰ 予約APIタイムアウト（10秒）')
      }, 10000) // 10秒タイムアウト

      try {
        // Google OAuthトークンを取得（複数の方法を試行）
        let providerToken = ''
        let tokenSource = 'none'
        
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.provider_token) {
            providerToken = session.provider_token
            tokenSource = 'supabase-session'
          }
        } catch (sessionError) {
          console.warn('🔥 Supabaseセッション取得失敗:', sessionError)
        }

        // Supabaseセッションからトークンが取得できない場合、localStorageを試行
        if (!providerToken) {
          try {
            const settings = JSON.parse(localStorage.getItem('fitness-app-settings') || '{}')
            if (settings.oauthToken) {
              providerToken = settings.oauthToken
              tokenSource = 'localStorage'
            }
          } catch (storageError) {
            console.warn('🔥 localStorage設定取得失敗:', storageError)
          }
        }

        // ウィンドウオブジェクトからの取得も試行
        if (!providerToken && typeof window !== 'undefined' && (window as any).fitnessAppSettings?.oauthToken) {
          providerToken = (window as any).fitnessAppSettings.oauthToken
          tokenSource = 'window-object'
        }

        console.log('🔥 予約リクエスト準備:', {
          hasProviderToken: !!providerToken,
          tokenLength: providerToken?.length,
          tokenStart: providerToken ? providerToken.substring(0, 20) + '...' : 'none',
          tokenSource: tokenSource,
          isLiffEnvironment: typeof window !== 'undefined' && window.location.hostname.includes('liff')
        })

        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Provider-Token': providerToken || '', // Google OAuthトークンを送信
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        })

        clearTimeout(timeoutId) // タイムアウトをクリア
        console.log('✅ 予約APIレスポンス受信:', { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'レスポンス解析エラー' }))
          console.error('❌ 予約API失敗:', errorData)
          throw new Error(errorData.error || `予約に失敗しました (HTTP ${response.status})`)
        }

        const result = await response.json()
        console.log('🎉 予約作成成功:', result)
        
        // 予約成功後、確実に自動同期を実行
        if (typeof window !== 'undefined' && result && result.success !== false) {
          console.log('✅ 予約成功確認 - 自動同期準備')
          setTimeout(() => {
            console.log('🔄 自動同期API呼び出し開始（Web）')
            // 手動ボタンと同じAPI（未同期データ送信）を呼び出し
            fetch('/api/webhook/sync-unsynced', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).then(response => {
              console.log('🔄 自動同期API応答（Web）:', response.status)
              if (response.ok) {
                console.log('✅ 予約完了後の自動同期成功（Web）')
              } else {
                console.warn('⚠️ 予約完了後の自動同期失敗（Web）:', response.status)
              }
            }).catch((error) => {
              console.warn('⚠️ 予約完了後の自動同期エラー（予約成功には影響なし）:', error)
            })
          }, 3000) // 3秒後に実行で確実にデータベース更新完了後
        }
        
        // リスト更新は失敗しても続行
        try {
          await fetchReservations()
          console.log('✅ 予約リスト更新成功')
        } catch (fetchError) {
          console.warn('⚠️ 予約リスト更新失敗（予約は成功済み）:', fetchError)
        }
        
        return result
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === 'AbortError') {
          console.error('⏰ 予約リクエストタイムアウト')
          throw new Error('予約処理がタイムアウトしました。時間をおいて再度お試しください。')
        }
        
        console.error('🌐 ネットワークエラー:', fetchError)
        throw new Error('ネットワーク接続エラーです。インターネット接続を確認してください。')
      }
    } catch (error) {
      console.error('❌ 予約作成エラー:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const cancelReservation = async (reservationId: number, reason?: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) throw new Error('キャンセルに失敗しました')
      
      const result = await response.json()
      await fetchReservations() // キャンセル後にリスト更新
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    reservations,
    loading,
    error,
    createReservation,
    cancelReservation,
    refetch: fetchReservations,
    debugReservationAuth
  }
}