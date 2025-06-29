'use client'

import React from 'react'
import { Schedule } from '@/types/api'
import { cn } from '@/lib/utils'

interface ScheduleBlockProps {
  schedule: Schedule
  onClick: (schedule: Schedule) => void
}

export function ScheduleBlock({ schedule, onClick }: ScheduleBlockProps) {
  // プログラムの色を取得（デフォルト値）
  const getColorClass = () => {
    if (schedule.program?.color_class) return schedule.program.color_class
    return 'bg-blue-500'
  }

  const getTextColorClass = () => {
    if (schedule.program?.text_color_class) return schedule.program.text_color_class
    return 'text-white'
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-md',
        getColorClass(),
        getTextColorClass()
      )}
      onClick={() => onClick(schedule)}
    >
      {/* 時間 */}
      <div className="text-sm font-bold mb-2">
        {schedule.startTime} - {schedule.endTime}
      </div>
      
      {/* プログラム名 */}
      <div className="text-base font-bold leading-tight mb-2">
        {schedule.program?.name || 'プログラム名未設定'}
      </div>
      
      {/* インストラクター */}
      <div className="text-sm opacity-90 mb-1">
        {schedule.instructor?.name || 'インストラクター未設定'}
      </div>
      
      {/* スタジオ */}
      <div className="text-sm opacity-80">
        {schedule.studio?.name || 'スタジオ未設定'}
      </div>
    </div>
  )
}