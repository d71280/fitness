'use client'

import { useState, useEffect, useCallback } from 'react'
import { Program } from '@/types/api'

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/programs')
      if (!response.ok) throw new Error('プログラム取得に失敗しました')
      
      const data = await response.json()
      console.log('🏋️ 取得したプログラム数:', data.length)
      console.log('🏋️ 取得したプログラム:', data)
      setPrograms(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  return { 
    programs, 
    loading, 
    error, 
    refetch: fetchPrograms 
  }
}