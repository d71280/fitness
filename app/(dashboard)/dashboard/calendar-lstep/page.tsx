'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Send, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function CalendarLstepPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dryRun, setDryRun] = useState(true)
  const [customBookings, setCustomBookings] = useState('')

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/calendar-to-lstep')
      const data = await response.json()
      setResult({ ...data, type: 'status' })
    } catch (error) {
      setResult({
        success: false,
        error: '接続テストに失敗しました',
        type: 'status'
      })
    } finally {
      setLoading(false)
    }
  }

  const runSampleTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-calendar-lstep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun })
      })
      
      const data = await response.json()
      setResult({ ...data, type: 'test' })
    } catch (error) {
      setResult({
        success: false,
        error: 'サンプルテストに失敗しました',
        type: 'test'
      })
    } finally {
      setLoading(false)
    }
  }

  const runCustomTest = async () => {
    if (!customBookings.trim()) {
      alert('カスタム予約データを入力してください')
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const bookings = JSON.parse(customBookings)
      
      const response = await fetch('/api/calendar-to-lstep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookings: Array.isArray(bookings) ? bookings : [bookings],
          source: 'custom_test',
          dryRun
        })
      })
      
      const data = await response.json()
      setResult({ ...data, type: 'custom' })
    } catch (error) {
      setResult({
        success: false,
        error: 'カスタムテストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        type: 'custom'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar to Lstep 連携</h1>
      </div>

      {/* 接続状況 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            接続状況確認
          </CardTitle>
          <CardDescription>
            Lstep APIの接続状況と最近の連携履歴を確認します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testConnection} disabled={loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            接続テスト
          </Button>
        </CardContent>
      </Card>

      {/* サンプルテスト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            サンプルデータテスト
          </CardTitle>
          <CardDescription>
            事前定義されたサンプル予約データでLstep連携をテストします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label>DryRunモード（実際にメッセージを送信しない）</Label>
          </div>
          
          <Button onClick={runSampleTest} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            サンプルテスト実行
          </Button>
        </CardContent>
      </Card>

      {/* カスタムテスト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            カスタムデータテスト
          </CardTitle>
          <CardDescription>
            独自の予約データでLstep連携をテストします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-bookings">予約データ（JSON形式）</Label>
            <Textarea
              id="custom-bookings"
              value={customBookings}
              onChange={(e) => setCustomBookings(e.target.value)}
              rows={8}
              placeholder={JSON.stringify([{
                id: 'custom_001',
                customerName: '顧客名',
                lineId: 'LINE_USER_ID',
                date: '2025-07-08',
                startTime: '10:00',
                endTime: '11:00',
                program: 'プログラム名',
                instructor: 'インストラクター名',
                studio: 'スタジオ名'
              }], null, 2)}
            />
          </div>
          
          <Button onClick={runCustomTest} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            カスタムテスト実行
          </Button>
        </CardContent>
      </Card>

      {/* 結果表示 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              テスト結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={result.success ? 'border-green-200' : 'border-red-200'}>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 使用方法 */}
      <Card>
        <CardHeader>
          <CardTitle>API使用方法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">エンドポイント</h4>
            <code className="bg-gray-100 p-2 rounded text-sm">
              POST /api/calendar-to-lstep
            </code>
          </div>
          
          <div>
            <h4 className="font-medium">リクエスト例</h4>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "bookings": [
    {
      "id": "booking_123",
      "customerName": "顧客名",
      "lineId": "LINE_USER_ID",
      "date": "2025-07-08",
      "startTime": "10:00",
      "endTime": "11:00",
      "program": "プログラム名",
      "instructor": "インストラクター名",
      "studio": "スタジオ名"
    }
  ],
  "source": "calendar",
  "dryRun": false
}`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium">注意事項</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• LINE IDが必須です（または電話番号/メールアドレスで検索）</li>
              <li>• DryRunモードでは実際のメッセージ送信は行われません</li>
              <li>• API制限を考慮して200ms間隔で送信されます</li>
              <li>• 連携結果はnotification_logsテーブルに記録されます</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}