'use client'

import React from 'react'
import { Schedule } from '@/types/api'
import { cn } from '@/lib/utils'

interface ScheduleBlockProps {
  schedule: Schedule
  onClick: (schedule: Schedule) => void
}

export function ScheduleBlock({ schedule, onClick }: ScheduleBlockProps) {
  const occupancyRate = (schedule.bookedCount / schedule.capacity) * 100
  const isFullyBooked = schedule.bookedCount >= schedule.capacity
  
  // 空き状況に応じた色の調整
  const getOpacityClass = () => {
    if (isFullyBooked) return 'opacity-60'
    if (occupancyRate > 80) return 'opacity-90'
    return 'opacity-100'
  }

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
        'p-2 rounded cursor-pointer transition-all hover:scale-105 hover:shadow-md',
        getColorClass(),
        getTextColorClass(),
        getOpacityClass(),
        isFullyBooked && 'cursor-not-allowed'
      )}
      onClick={() => onClick(schedule)}
    >
      {/* 時間 */}
      <div className="text-xs font-medium mb-1">
        {schedule.startTime} - {schedule.endTime}
      </div>
      
      {/* プログラム名 */}
      <div className="text-sm font-bold leading-tight mb-1">
        {schedule.program?.name || 'プログラム名未設定'}
      </div>
      
      {/* インストラクター */}
      <div className="text-xs opacity-90 mb-1">
        {schedule.instructor?.name || 'インストラクター未設定'}
      </div>
      
      {/* 空き状況 */}
      <div className="flex justify-between items-center text-xs">
        <span className="opacity-90">{schedule.studio?.name || 'スタジオ未設定'}</span>
        <span className={cn(
          'font-medium',
          isFullyBooked ? 'text-red-200' : 'text-current'
        )}>
          {isFullyBooked ? '満席' : `残${schedule.capacity - schedule.bookedCount}`}
        </span>
      </div>
      
      {/* 定員表示 */}
      <div className="text-xs opacity-75 mt-1">
        {schedule.bookedCount}/{schedule.capacity}名
      </div>
    </div>
  )
}