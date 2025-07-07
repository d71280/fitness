'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Modal } from '@/components/ui/modal'
import { MessageSquare, Clock, Plus, Trash2, TestTube, Save, Mail } from 'lucide-react'
import type { MessageSettings, ReminderSchedule } from '@/lib/message-templates'

export default function MessagesPage() {
  // エラーダイアログを検出するためのグローバルエラーハンドラー
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 グローバルエラー検出:', event)
      if (event.message && event.message.includes('リマインダストップ')) {
        console.error('🔍 リマインダストップエラーの詳細:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 未処理のPromise拒否:', event)
      if (event.reason && String(event.reason).includes('リマインダストップ')) {
        console.error('🔍 リマインダストップPromise拒否の詳細:', event.reason)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const [messageSettings, setMessageSettings] = useState({
    bookingConfirmation: {
      enabled: true,
      messageText: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n\nお忘れなくお越しください！'
    },
    reminder: {
      enabled: true,
      hoursBefore: 24,
      messageText: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊'
    }
  })

  const [reminderSettings, setReminderSettings] = useState<MessageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<{
    reminder?: boolean | null
  }>({
    reminder: null
  })

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<ReminderSchedule>>({
    id: '',
    name: '',
    isActive: true,
    timingHours: 1,
    messageTemplate: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('📖 設定読み込み開始...')
      const response = await fetch('/api/settings')
      const data = await response.json()
      console.log('📖 読み込んだデータ:', data)
      
      if (data.success) {
        if (data.messages) {
          console.log('💾 メッセージ設定をセット:', data.messages)
          setMessageSettings(data.messages)
        }
        if (data.settings) {
          console.log('⚙️ リマインド設定をセット:', data.settings)
          setReminderSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const payload = {
        messages: messageSettings,
        settings: reminderSettings
      }
      console.log('📤 フロントエンド送信データ:', payload)
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('📥 サーバーレスポンス:', result)
      
      if (result.success) {
        alert('設定が保存されました')
        // 保存後にデータを再読み込み
        await loadSettings()
      } else {
        alert(`設定保存に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert('設定保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addCustomSchedule = async () => {
    if (!newSchedule.id || !newSchedule.name || !newSchedule.messageTemplate || !newSchedule.timingHours) {
      alert('すべてのフィールドを入力してください')
      return
    }

    try {
      const payload = {
        action: 'addReminderSchedule',
        schedule: newSchedule
      }
      console.log('📤 カスタムスケジュール追加リクエスト:', payload)

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      console.log('📥 カスタムスケジュール追加レスポンス:', data)
      
      if (data.success) {
        alert('カスタムリマインドスケジュールが追加されました')
        await loadSettings()
        setIsAddModalOpen(false)
        setNewSchedule({
          id: '',
          name: '',
          isActive: true,
          timingHours: 1,
          messageTemplate: ''
        })
      } else {
        console.error('❌ カスタムスケジュール追加失敗:', data)
        alert(`追加に失敗しました: ${data.error}${data.details ? '\n詳細: ' + JSON.stringify(data.details) : ''}`)
      }
    } catch (error) {
      console.error('❌ カスタムスケジュール追加エラー:', error)
      alert('スケジュールの追加でエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const deleteCustomSchedule = async (scheduleId: string) => {
    if (!confirm('このリマインドスケジュールを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/settings?scheduleId=${scheduleId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadSettings()
        alert('リマインドスケジュールが削除されました')
      } else {
        alert(`削除に失敗しました: ${data.error}`)
      }
    } catch (error) {
      console.error('スケジュール削除エラー:', error)
      alert('スケジュールの削除でエラーが発生しました')
    }
  }

  const updateSchedule = (scheduleId: string, isCustom: boolean, updates: Partial<ReminderSchedule>) => {
    if (!reminderSettings) return

    const newSettings = { ...reminderSettings }
    const targetArray = isCustom ? newSettings.reminder?.customSchedules || [] : newSettings.reminder?.schedules || []
    const scheduleIndex = targetArray.findIndex(s => s.id === scheduleId)
    
    if (scheduleIndex !== -1) {
      targetArray[scheduleIndex] = { ...targetArray[scheduleIndex], ...updates }
      setReminderSettings(newSettings)
    }
  }

  const testReminders = async () => {
    setSaving(true)
    setTestResults(prev => ({ ...prev, reminder: null }))
    
    try {
      const response = await fetch('/api/cron/daily-reminders', {
        method: 'POST'
      })
      const data = await response.json()
      
      setTestResults(prev => ({ ...prev, reminder: data.success }))
      
      if (data.success) {
        alert(`リマインドテスト完了！\n送信数: ${data.totalSent}\n結果: ${JSON.stringify(data.results, null, 2)}`)
      } else {
        alert(`リマインドテスト失敗: ${data.error}`)
      }
    } catch (error) {
      console.error('リマインドテストエラー:', error)
      setTestResults(prev => ({ ...prev, reminder: false }))
      alert('リマインドテストでエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <div className="text-lg">設定読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">メッセージ・リマインド設定</h1>
        <p className="text-muted-foreground">
          予約完了メッセージとリマインド機能の設定を管理します
        </p>
      </div>

      {/* 予約完了メッセージ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>予約完了メッセージ設定</CardTitle>
          </div>
          <CardDescription>
            予約完了時に自動送信されるメッセージの内容を設定できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={messageSettings.bookingConfirmation.enabled}
              onCheckedChange={(checked) =>
                setMessageSettings(prev => ({
                  ...prev,
                  bookingConfirmation: { ...prev.bookingConfirmation, enabled: checked }
                }))
              }
            />
            <Label>予約完了メッセージを送信</Label>
          </div>

          <div>
            <Label htmlFor="booking-message">メッセージ内容</Label>
            <Textarea
              id="booking-message"
              value={messageSettings.bookingConfirmation.messageText}
              onChange={(e) =>
                setMessageSettings(prev => ({
                  ...prev,
                  bookingConfirmation: { ...prev.bookingConfirmation, messageText: e.target.value }
                }))
              }
              rows={6}
              placeholder="予約完了時のメッセージを入力してください"
              disabled={!messageSettings.bookingConfirmation.enabled}
            />
            <p className="text-sm text-gray-500 mt-2">
              メッセージ内容で使用可能な変数: {`{date}, {time}, {program}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* リマインドメッセージ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <CardTitle>リマインドメッセージ設定</CardTitle>
          </div>
          <CardDescription>
            レッスンの何時間前にリマインドメッセージを送信するかを設定できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={messageSettings.reminder.enabled}
              onCheckedChange={(checked) =>
                setMessageSettings(prev => ({
                  ...prev,
                  reminder: { ...prev.reminder, enabled: checked }
                }))
              }
            />
            <Label>リマインドメッセージを送信</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours-before">送信タイミング（時間前）</Label>
              <Input
                id="hours-before"
                type="number"
                min="1"
                max="168"
                value={messageSettings.reminder.hoursBefore}
                onChange={(e) =>
                  setMessageSettings(prev => ({
                    ...prev,
                    reminder: { ...prev.reminder, hoursBefore: parseInt(e.target.value) || 24 }
                  }))
                }
                disabled={!messageSettings.reminder.enabled}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reminder-message">メッセージ内容</Label>
            <Textarea
              id="reminder-message"
              value={messageSettings.reminder.messageText}
              onChange={(e) =>
                setMessageSettings(prev => ({
                  ...prev,
                  reminder: { ...prev.reminder, messageText: e.target.value }
                }))
              }
              rows={6}
              placeholder="リマインドメッセージを入力してください"
              disabled={!messageSettings.reminder.enabled}
            />
            <p className="text-sm text-gray-500 mt-2">
              メッセージ内容で使用可能な変数: {`{date}, {time}, {program}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 詳細リマインド設定 */}
      {reminderSettings && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>詳細リマインド設定</CardTitle>
                <CardDescription>
                  カスタムリマインドスケジュールを管理します
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                カスタムスケジュール追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* デフォルトスケジュール */}
            <div>
              <h4 className="font-semibold mb-3">デフォルトスケジュール</h4>
              <div className="space-y-3">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">設定を読み込み中...</div>
                ) : reminderSettings?.reminder?.schedules?.map((schedule) => (
                  <div key={schedule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={(checked) =>
                            updateSchedule(schedule.id, false, { isActive: checked })
                          }
                        />
                        <span className="font-medium">{schedule.name}</span>
                        <span className="text-sm text-gray-500">
                          ({schedule.timingHours}時間前)
                        </span>
                      </div>
                    </div>
                    <Textarea
                      value={schedule.messageTemplate}
                      onChange={(e) =>
                        updateSchedule(schedule.id, false, { messageTemplate: e.target.value })
                      }
                      rows={3}
                      className="mt-2"
                      disabled={!schedule.isActive}
                    />
                  </div>
                )) || <div className="p-4 text-center text-gray-500">スケジュールが設定されていません</div>}
              </div>
            </div>

            {/* カスタムスケジュール */}
            {reminderSettings?.reminder?.customSchedules?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">カスタムスケジュール</h4>
                <div className="space-y-3">
                  {reminderSettings?.reminder?.customSchedules?.map((schedule) => (
                    <div key={schedule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={(checked) =>
                              updateSchedule(schedule.id, true, { isActive: checked })
                            }
                          />
                          <span className="font-medium">{schedule.name}</span>
                          <span className="text-sm text-gray-500">
                            ({schedule.timingHours}時間前)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCustomSchedule(schedule.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={schedule.messageTemplate}
                        onChange={(e) =>
                          updateSchedule(schedule.id, true, { messageTemplate: e.target.value })
                        }
                        rows={3}
                        className="mt-2"
                        disabled={!schedule.isActive}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* テスト・保存 */}
      <Card>
        <CardHeader>
          <CardTitle>設定の確認とテスト</CardTitle>
          <CardDescription>
            設定を保存して、リマインド機能をテストできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中...' : '設定を保存'}</span>
            </Button>

            <Button
              onClick={testReminders}
              disabled={saving}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <TestTube className="w-4 h-4" />
              <span>リマインドテスト</span>
              {testResults.reminder === true && <span className="text-green-600">✓</span>}
              {testResults.reminder === false && <span className="text-red-600">✗</span>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* カスタムスケジュール追加モーダル */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="カスタムリマインドスケジュール追加"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-id">スケジュールID</Label>
            <Input
              id="schedule-id"
              value={newSchedule.id}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, id: e.target.value }))}
              placeholder="例: custom_2hours"
            />
          </div>

          <div>
            <Label htmlFor="schedule-name">スケジュール名</Label>
            <Input
              id="schedule-name"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例: 2時間前リマインド"
            />
          </div>

          <div>
            <Label htmlFor="timing-hours">送信タイミング（時間前）</Label>
            <Input
              id="timing-hours"
              type="number"
              min="1"
              value={newSchedule.timingHours}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, timingHours: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div>
            <Label htmlFor="message-template">メッセージテンプレート</Label>
            <Textarea
              id="message-template"
              value={newSchedule.messageTemplate}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, messageTemplate: e.target.value }))}
              rows={4}
              placeholder="リマインドメッセージテンプレートを入力してください"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={addCustomSchedule}>
              追加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 