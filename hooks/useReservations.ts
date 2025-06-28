'use client'

import { useState } from 'react'
import { CreateReservationData } from '@/types/api'

export function useReservations() {
  const [loading, setLoading] = useState(false)

  const createReservation = async (data: CreateReservationData) => {
    try {
      setLoading(true)
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '予約に失敗しました')
      }

      const result = await response.json()
      return result
    } catch (error) {
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
      
      return await response.json()
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createReservation,
    cancelReservation,
  }
}