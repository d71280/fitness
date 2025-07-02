'use client'
// @ts-nocheck

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Schedule, CreateReservationData } from '@/types/api'
import { Calendar, Clock, User, MapPin } from 'lucide-react'

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
    customerNameKanji: '',
    customerNameKatakana: '',
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
    
    if (!formData.customerNameKanji) {
      alert('お名前（漢字）は必須項目です')
      return
    }
    
    if (!formData.customerNameKatakana) {
      alert('お名前（カタカナ）は必須項目です')
      return
    }
    
    if (!formData.phone) {
      alert('電話番号は必須項目です')
      return
    }

    setLoading(true)
    try {
      // LIFF ユーザーIDを確実に設定
      const reservationData = {
        ...formData,
        lineId: liffUserId
      }
      
      const result = await onSubmit(reservationData)
      
      // TODO: 予約完了後APIトリガーを一時的に無効化（デバッグ用）
      // try {
      //   if (result?.reservation) {
      //     console.log('予約完了トリガー実行中...')
      //     await fetch('/api/trigger-reservation-complete', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         reservation: result.reservation,
      //         trigger: 'reservation_complete'
      //       })
      //     })
      //     console.log('予約完了トリガー実行完了')
      //   }
      // } catch (triggerError) {
      //   console.warn('予約完了トリガーエラー（予約は成功しています）:', triggerError)
      // }
      
      onClose()
      // フォームをリセット
      setFormData({
        scheduleId: 0,
        customerNameKanji: '',
        customerNameKatakana: '',
        lineId: '',
        phone: '',
      })
      alert('予約が完了しました！LINEに確認メッセージをお送りします。')
    } catch (error: any) {
      console.error('📱 予約処理エラー:', error)
      
      // エラーメッセージを詳細に表示
      let errorMessage = '予約処理でエラーが発生しました'
      let additionalInfo = ''
      
      if (error?.message) {
        if (error.message.includes('タイムアウト')) {
          errorMessage = '⏰ 予約処理がタイムアウトしました'
          additionalInfo = `
          
【重要】予約が完了している可能性があります！
サーバーの処理に時間がかかっているだけで、実際には予約が成功している場合があります。

【確認方法】
1. 数分後にスケジュール画面を再読み込み
2. 予約確認LINEメッセージをチェック
3. 重複予約を避けるため、再予約前に必ずご確認ください`
        } else if (error.message.includes('ネットワーク')) {
          errorMessage = '🌐 ネットワーク接続エラー'
          additionalInfo = `
          
インターネット接続を確認してください。
LINEアプリの設定で「外部リンクをブラウザで開く」がオンになっている場合は、オフにしてお試しください。`
        } else if (error.message.includes('400')) {
          errorMessage = '📝 入力データエラー'
          additionalInfo = '\n\n入力内容をご確認ください。'
        } else if (error.message.includes('404')) {
          errorMessage = '🔍 スケジュールが見つかりません'
          additionalInfo = '\n\nページを再読み込みしてお試しください。'
        } else {
          errorMessage = `予約エラー: ${error.message}`
          additionalInfo = `
          
【重要】このエラーでも予約が完了している可能性があります！
1. LINEで確認メッセージが届いていないかチェック
2. 数分後にスケジュール画面を確認
3. 不明な場合はスタジオまでお問い合わせください`
        }
      }
      
             // 詳細ログ出力
       console.group('🔍 予約エラー詳細分析')
       console.log('エラーオブジェクト:', error)
       console.log('エラーメッセージ:', error?.message)
       console.log('エラータイプ:', error?.name)
       console.log('予約データ:', {
         scheduleId: formData.scheduleId,
         customerNameKanji: formData.customerNameKanji,
         customerNameKatakana: formData.customerNameKatakana,
         lineId: liffUserId,
         phone: formData.phone
       })
       console.log('LIFF ユーザーID:', liffUserId)
       console.log('スケジュール:', schedule)
       console.groupEnd()
      
      alert(errorMessage + additionalInfo)
    } finally {
      setLoading(false)
    }
  }

  if (!schedule) return null

  // デバッグ用ログ
  console.log('BookingModal - schedule data:', schedule)
  console.log('BookingModal - program data:', schedule.program)
  console.log('BookingModal - currentBookings:', schedule.currentBookings)
  console.log('BookingModal - availableSlots:', schedule.availableSlots)

  const currentBookings = schedule.currentBookings || schedule.bookedCount || 0
  const isFullyBooked = currentBookings >= schedule.capacity
  const availableSpots = schedule.availableSlots || (schedule.capacity - currentBookings)

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
                {schedule.startTime?.slice(0, 5)} - {schedule.endTime?.slice(0, 5)}
              </div>
              <div className="text-lg font-bold mb-2">
                {schedule.program?.name || 'プログラム名未設定'}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm opacity-90">


              </div>
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
              <Label htmlFor="customerNameKanji">
                お名前（漢字） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerNameKanji"
                type="text"
                value={formData.customerNameKanji}
                onChange={(e) => setFormData(prev => ({ ...prev, customerNameKanji: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerNameKatakana">
                お名前（カタカナ） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerNameKatakana"
                type="text"
                value={formData.customerNameKatakana}
                onChange={(e) => setFormData(prev => ({ ...prev, customerNameKatakana: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">
                電話番号 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
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

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={loading || !liffUserId}
                className="flex-1 w-full sm:w-auto"
              >
                {loading ? '予約中...' : '予約する'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 w-full sm:w-auto"
              >
                キャンセル
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