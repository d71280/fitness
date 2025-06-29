'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreateReservationData, Reservation } from '@/types/api'

export function useReservations() {
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reservations')
      if (!response.ok) throw new Error('予約取得に失敗しました')
      
      const data = await response.json()
      setReservations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

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
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    refetch: fetchReservations
  }
}