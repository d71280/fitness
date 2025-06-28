'use client'

import { useState, useEffect } from 'react'
import { Instructor } from '@/types/api'

export function useInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstructors = async () => {
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
    }

    fetchInstructors()
  }, [])

  return { instructors, loading, error }
}