// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, CheckCircle, XCircle, Clock, Send } from 'lucide-react'

export default function TestReminderPage() {
  const [reservationId, setReservationId] = useState('')
  const [hoursBeforeClass, setHoursBeforeClass] = useState('24')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testReminder = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId || undefined,
          hoursBeforeClass: parseInt(hoursBeforeClass)
        })
      })
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        setResult({
          success: false,
          message: 'サーバーからの応答の解析に失敗しました',
          error: parseError instanceof Error ? parseError.message : String(parseError),
          status: response.status
        })
        return
      }
      setResult({ ...data, status: response.status })
    } catch (error) {
      setResult({
        success: false,
        message: 'エラーが発生しました',
        error: error instanceof Error ? error.message : String(error),
        status: 500
      })
    } finally {
      setLoading(false)
    }
  }
  
  const testWithLatest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-reminder')
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        setResult({
          success: false,
          message: 'サーバーからの応答の解析に失敗しました',
          error: parseError instanceof Error ? parseError.message : String(parseError),
          status: response.status
        })
        return
      }
      setResult({ ...data, status: response.status })
    } catch (error) {
      setResult({
        success: false,
        message: 'エラーが発生しました',
        error: error instanceof Error ? error.message : String(error),
        status: 500
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">リマインダーテスト</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            リマインドメッセージテスト送信
          </CardTitle>
          <CardDescription>
            指定した予約に対してリマインドメッセージをテスト送信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* テスト設定 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservationId">予約ID（空欄の場合は最新の予約を使用）</Label>
              <Input
                id="reservationId"
                type="text"
                placeholder="予約IDを入力"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timing">リマインドタイミング</Label>
              <Select value={hoursBeforeClass} onValueChange={setHoursBeforeClass}>
                <SelectTrigger id="timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1時間前</SelectItem>
                  <SelectItem value="3">3時間前</SelectItem>
                  <SelectItem value="6">6時間前</SelectItem>
                  <SelectItem value="12">12時間前</SelectItem>
                  <SelectItem value="24">24時間前（前日）</SelectItem>
                  <SelectItem value="48">48時間前（2日前）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button
              onClick={testReminder}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  テスト送信
                </>
              )}
            </Button>
            
            <Button
              onClick={testWithLatest}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              最新の予約でテスト
            </Button>
          </div>

          {/* 結果表示 */}
          {result && (
            <Alert className={result.success ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertDescription className="font-medium">
                    {result.message}
                  </AlertDescription>
                  
                  {result.details && (
                    <div className="text-sm space-y-1 text-gray-600">
                      <p>顧客名: {result.details.customerName}</p>
                      <p>スケジュール: {result.details.scheduleName}</p>
                      <p>タイミング: {result.details.timing}</p>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-medium mb-1">メッセージプレビュー:</p>
                        <p className="whitespace-pre-wrap">{result.details.messagePreview}</p>
                      </div>
                    </div>
                  )}
                  
                  {result.testInfo && (
                    <div className="text-sm space-y-1 text-gray-600 border-t pt-2">
                      <p className="font-medium">{result.testInfo.message}</p>
                      <p>予約ID: {result.testInfo.reservation.id}</p>
                      <p>顧客: {result.testInfo.reservation.customer}</p>
                      <p>スケジュール: {result.testInfo.reservation.schedule}</p>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-sm text-red-600 mt-2">
                      エラー詳細: {result.error}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* 使用方法 */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-blue-900">使用方法</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 予約IDを指定するか、空欄にして最新の予約を使用できます</li>
              <li>• リマインドタイミングを選択してテスト送信します</li>
              <li>• 実際にLINEメッセージが送信されるので注意してください</li>
              <li>• 送信先は予約した顧客のLINEアカウントです</li>
            </ul>
          </div>

          {/* cronジョブ情報 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-900">自動リマインド設定</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• エンドポイント: /api/cron/daily-reminders</p>
              <p>• 推奨実行間隔: 1時間ごと</p>
              <p>• 各実行時に設定されたタイミングに合う予約を自動検出</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}