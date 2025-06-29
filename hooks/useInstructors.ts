'use client'

import { useState, useEffect, useCallback } from 'react'
import { Instructor } from '@/types/api'

export function useInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/instructors')
      if (!response.ok) throw new Error('インストラクター取得に失敗しました')
      
      const data = await response.json()
      setInstructors(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  return { 
    instructors, 
    loading, 
    error, 
    refetch: fetchInstructors 
  }
}