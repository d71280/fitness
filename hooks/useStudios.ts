'use client'

import { useState, useEffect } from 'react'
import { Studio } from '@/types/api'

export function useStudios() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/studios')
        if (!response.ok) throw new Error('スタジオ取得に失敗しました')
        
        const data = await response.json()
        setStudios(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchStudios()
  }, [])

  return { studios, loading, error }
}