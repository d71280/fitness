'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Schedule, CreateReservationData } from '@/types/api'
import { Calendar, Clock, User, MapPin, Users } from 'lucide-react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: Schedule | null
  onSubmit: (data: CreateReservationData) => Promise<void>
  liffUserId: string | null
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  schedule, 
  onSubmit,
  liffUserId 
}: BookingModalProps) {
  const [formData, setFormData] = useState<CreateReservationData>({
    scheduleId: 0,
    customerName: '',
    lineId: '',
    phone: '',
  })

  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (schedule) {
      setFormData(prev => ({ ...prev, scheduleId: schedule.id }))
    }
  }, [schedule])

  // LIFF ユーザーIDを自動設定
  React.useEffect(() => {
    if (liffUserId) {
      setFormData(prev => ({ ...prev, lineId: liffUserId }))
    }
  }, [liffUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!liffUserId) {
      alert('LINE認証エラーです。ページを再読み込みしてください。')
      return
    }
    
    if (!formData.customerName) {
      alert('お名前は必須項目です')
      return
    }

    setLoading(true)
    try {
      // LIFF ユーザーIDを確実に設定
      const reservationData = {
        ...formData,
        lineId: liffUserId
      }
      
      await onSubmit(reservationData)
      onClose()
      // フォームをリセット
      setFormData({
        scheduleId: 0,
        customerName: '',
        lineId: '',
        phone: '',
      })
      alert('予約が完了しました！LINEに確認メッセージをお送りします。')
    } catch (error) {
      console.error('予約エラー:', error)
      alert('予約に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!schedule) return null

  const isFullyBooked = schedule.bookedCount >= schedule.capacity
  const availableSpots = schedule.capacity - schedule.bookedCount

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="クラス予約"
      size="md"
    >
      <div className="space-y-6">
        {/* スケジュール詳細 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">予約内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${schedule.program?.color_class || 'bg-blue-500'} ${schedule.program?.text_color_class || 'text-white'}`}>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4" />
                {schedule.startTime} - {schedule.endTime}
              </div>
              <div className="text-lg font-bold mb-2">
                {schedule.program?.name || 'プログラム名未設定'}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {schedule.instructor?.name || 'インストラクター未設定'}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {schedule.studio?.name || 'スタジオ未設定'}
                </div>
              </div>
            </div>

            {/* 空き状況 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {isFullyBooked ? '満席' : `残り${availableSpots}席`}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {schedule.bookedCount}/{schedule.capacity}名
              </span>
            </div>

            {isFullyBooked && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  このクラスは満席です。キャンセル待ちをご希望の場合は、スタジオにお問い合わせください。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LINE 認証確認 */}
        {liffUserId && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="text-green-600">✅</div>
              <div className="text-sm text-green-700">
                <strong>LINE認証済み</strong><br />
                予約完了後、LINEに確認メッセージをお送りします。
              </div>
            </div>
          </div>
        )}

        {/* 予約フォーム */}
        {!isFullyBooked && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName">
                お名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="山田 太郎"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">電話番号（任意）</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="090-1234-5678"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>予約について</strong><br />
                <span className="block space-y-1">
                  <span className="block">• 予約完了後、LINE経由で確認メッセージをお送りします</span>
                  <span className="block">• レッスン前日にはリマインダーも配信されます</span>
                  <span className="block">• キャンセルはLINEメッセージで承ります</span>
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 w-full sm:w-auto"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={loading || !liffUserId}
                className="flex-1 w-full sm:w-auto"
              >
                {loading ? '予約中...' : '予約する'}
              </Button>
            </div>
          </form>
        )}

        {/* LINE認証エラーの場合 */}
        {!liffUserId && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-sm text-red-700">
              LINE認証が完了していません。<br />
              ページを再読み込みして、再度お試しください。
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}