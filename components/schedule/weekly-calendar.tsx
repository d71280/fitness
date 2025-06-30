'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeekStart, getWeekDates, formatDate, isToday, isWeekend } from '@/lib/utils'
import { Schedule } from '@/types/api'
import { ScheduleBlock } from './schedule-block'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'

interface WeeklyCalendarProps {
  schedules: Record<string, Schedule[]>
  onAddSchedule?: (date: string) => void
  onScheduleClick: (schedule: Schedule) => void
  showAddButton?: boolean
  currentWeek?: Date
  onWeekChange?: (week: Date) => void
}

export function WeeklyCalendar({ 
  schedules, 
  onAddSchedule, 
  onScheduleClick,
  showAddButton = false,
  currentWeek: propCurrentWeek,
  onWeekChange
}: WeeklyCalendarProps) {
  const [internalCurrentWeek, setInternalCurrentWeek] = useState(() => getWeekStart(new Date()))
  
  // 外部から渡されたcurrentWeekがあれば優先、なければ内部状態を使用
  const currentWeek = propCurrentWeek || internalCurrentWeek
  const setCurrentWeek = onWeekChange || setInternalCurrentWeek

  const weekDates = getWeekDates(currentWeek)
  const dayNames = ['月', '火', '水', '木', '金', '土', '日']

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(currentWeek.getDate() - 7)
    setCurrentWeek(prevWeek)
  }

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(currentWeek.getDate() + 7)
    setCurrentWeek(nextWeek)
  }

  const goToToday = () => {
    setCurrentWeek(getWeekStart(new Date()))
  }

  const formatDateHeader = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="w-full">
      {/* ヘッダー */}
      <div className="flex flex-col space-y-4 mb-6 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <h1 className="text-xl md:text-2xl font-bold">週間スケジュール</h1>
          <Button variant="outline" onClick={goToToday} size="sm" className="w-fit">
            <Calendar className="h-4 w-4 mr-2" />
            今日
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base md:text-lg font-medium px-2 md:px-4 text-center">
            {currentWeek.getFullYear()}年 {currentWeek.getMonth() + 1}月
          </span>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カレンダーグリッド - レスポンシブ対応 */}
      <div className="flex flex-col space-y-4 md:hidden">
        {/* モバイル表示：縦スタック */}
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date)
          const daySchedules = schedules[dateStr] || []
          const todayClass = isToday(date) ? 'ring-2 ring-blue-500' : ''
          const weekendClass = isWeekend(date) ? 'bg-gray-50' : 'bg-white'

          return (
            <Card key={dateStr} className={`${todayClass} ${weekendClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{dayNames[index]}</span>
                    <span className={`text-lg ${isToday(date) ? 'text-blue-600 font-bold' : ''}`}>
                      {formatDateHeader(date)}
                    </span>
                  </div>
                  {isToday(date) && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">今日</span>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {/* 新規追加ボタン（管理画面でのみ表示） */}
                {showAddButton && onAddSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => onAddSchedule(dateStr)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    追加
                  </Button>
                )}

                {/* スケジュールブロック */}
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <ScheduleBlock
                      key={schedule.id}
                      schedule={schedule}
                      onClick={onScheduleClick}
                    />
                  ))}
                </div>

                {/* 空の日の表示 */}
                {daySchedules.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    予定なし
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* タブレット・デスクトップ表示：グリッド */}
      <div className="hidden md:grid md:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date)
          const daySchedules = schedules[dateStr] || []
          const todayClass = isToday(date) ? 'ring-2 ring-blue-500' : ''
          const weekendClass = isWeekend(date) ? 'bg-gray-50' : 'bg-white'

          return (
            <Card key={dateStr} className={`${todayClass} ${weekendClass}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">
                  <div className="text-sm text-gray-600">{dayNames[index]}</div>
                  <div className={`text-lg ${isToday(date) ? 'text-blue-600 font-bold' : ''}`}>
                    {formatDateHeader(date)}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {/* 新規追加ボタン（管理画面でのみ表示） */}
                {showAddButton && onAddSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => onAddSchedule(dateStr)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    追加
                  </Button>
                )}

                {/* スケジュールブロック */}
                <div className="space-y-1">
                  {daySchedules.map((schedule) => (
                    <ScheduleBlock
                      key={schedule.id}
                      schedule={schedule}
                      onClick={onScheduleClick}
                    />
                  ))}
                </div>

                {/* 空の日の表示 */}
                {daySchedules.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    予定なし
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}