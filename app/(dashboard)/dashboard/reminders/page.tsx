'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import type { MessageSettings, ReminderSchedule } from '@/lib/message-templates'

export default function RemindersPage() {
  const [settings, setSettings] = useState<MessageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (data.success && data.settings) {
        setSettings(data.settings)
      } else {
        alert('設定の読み込みに失敗しました')
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
      alert('設定の読み込みでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('設定が保存されました')
      } else {
        alert(`保存に失敗しました: ${data.error}`)
      }
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert('設定の保存でエラーが発生しました')
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
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'addReminderSchedule',
          schedule: newSchedule
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadSettings()
        setIsAddModalOpen(false)
        setNewSchedule({
          id: '',
          name: '',
          isActive: true,
          timingHours: 1,
          messageTemplate: ''
        })
        alert('リマインドスケジュールが追加されました')
      } else {
        alert(`追加に失敗しました: ${data.error}`)
      }
    } catch (error) {
      console.error('スケジュール追加エラー:', error)
      alert('スケジュールの追加でエラーが発生しました')
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
    if (!settings) return

    const newSettings = { ...settings }
    const targetArray = isCustom ? newSettings.reminder.customSchedules : newSettings.reminder.schedules
    const scheduleIndex = targetArray.findIndex(s => s.id === scheduleId)
    
    if (scheduleIndex !== -1) {
      targetArray[scheduleIndex] = { ...targetArray[scheduleIndex], ...updates }
      setSettings(newSettings)
    }
  }

  const testReminders = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/cron/daily-reminders', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`リマインドテスト完了！\n送信数: ${data.totalSent}\n結果: ${JSON.stringify(data.results, null, 2)}`)
      } else {
        alert(`リマインドテスト失敗: ${data.error}`)
      }
    } catch (error) {
      console.error('リマインドテストエラー:', error)
      alert('リマインドテストでエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <div className="text-lg">設定読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-lg text-red-600">設定の読み込みに失敗しました</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📱 リマインド設定</h1>
            <p className="text-gray-600 mt-2">レッスン前のリマインドメッセージのタイミングとメッセージを設定できます。</p>
          </div>
          <Button
            onClick={testReminders}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            🧪 リマインドテスト
          </Button>
        </div>

        {/* メインリマインド設定 */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">リマインド機能</h2>
                <p className="text-sm text-gray-600">レッスン前のリマインドメッセージの送信を設定します</p>
              </div>
              <Switch
                checked={settings.reminder.enabled}
                onCheckedChange={(enabled) => setSettings({
                  ...settings,
                  reminder: { ...settings.reminder, enabled }
                })}
              />
            </div>

            {settings.reminder.enabled && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">リマインドスケジュール</h3>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ＋ カスタムスケジュール追加
                  </Button>
                </div>

                {/* デフォルトスケジュール */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    🏠 デフォルトスケジュール
                    <span className="text-xs text-gray-500 ml-2">（システム標準）</span>
                  </h4>
                  {settings.reminder.schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={(isActive) => updateSchedule(schedule.id, false, { isActive })}
                          />
                          <div>
                            <span className="font-medium text-lg">{schedule.name}</span>
                            <div className="text-sm text-gray-500">
                              {schedule.timingHours >= 24 
                                ? `${schedule.timingHours / 24}日前` 
                                : `${schedule.timingHours}時間前`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          デフォルト
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">メッセージテンプレート</Label>
                        <Textarea
                          value={schedule.messageTemplate}
                          onChange={(e) => updateSchedule(schedule.id, false, { messageTemplate: e.target.value })}
                          rows={4}
                          placeholder="リマインドメッセージを入力..."
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          📝 使用可能な変数: <code>{'{date}'}</code>, <code>{'{time}'}</code>, <code>{'{program}'}</code>, <code>{'{instructor}'}</code>, <code>{'{studio}'}</code>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* カスタムスケジュール */}
                {settings.reminder.customSchedules.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 flex items-center">
                      ⚙️ カスタムスケジュール
                      <span className="text-xs text-gray-500 ml-2">（あなたが追加したもの）</span>
                    </h4>
                    {settings.reminder.customSchedules.map((schedule) => (
                      <div key={schedule.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <Switch
                                                          checked={schedule.isActive}
                            onCheckedChange={(isActive) => updateSchedule(schedule.id, true, { isActive })}
                            />
                            <div>
                              <span className="font-medium text-lg">{schedule.name}</span>
                              <div className="text-sm text-gray-600">
                                {schedule.timingHours >= 24 
                                  ? `${schedule.timingHours / 24}日前` 
                                  : schedule.timingHours < 1 
                                    ? `${schedule.timingHours * 60}分前`
                                    : `${schedule.timingHours}時間前`}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCustomSchedule(schedule.id)}
                          >
                            🗑️ 削除
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">メッセージテンプレート</Label>
                          <Textarea
                            value={schedule.messageTemplate}
                            onChange={(e) => updateSchedule(schedule.id, true, { messageTemplate: e.target.value })}
                            rows={4}
                            placeholder="リマインドメッセージを入力..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 使用方法のヒント */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">💡 使用方法のヒント</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 複数のタイミングを設定することで、段階的なリマインドが可能です</li>
                    <li>• 1時間前、30分前などの直前リマインドは準備を促すのに効果的です</li>
                    <li>• メッセージは変数を使って自動的にレッスン情報が挿入されます</li>
                    <li>• テスト機能で実際の送信をシミュレーションできます</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={loadSettings}
            variant="outline"
            disabled={saving}
          >
            🔄 リロード
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? '保存中...' : '💾 設定を保存'}
          </Button>
        </div>
      </div>

      {/* カスタムスケジュール追加モーダル */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="🆕 リマインドスケジュール追加">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              💡 新しいリマインドタイミングを追加できます。例：2時間前、15分前など
            </p>
          </div>

          <div>
            <Label htmlFor="scheduleId">スケジュールID *</Label>
            <Input
              id="scheduleId"
              value={newSchedule.id || ''}
              onChange={(e) => setNewSchedule({ ...newSchedule, id: e.target.value })}
              placeholder="例: 2h, 15min, custom1"
            />
            <p className="text-xs text-gray-500 mt-1">英数字で一意のIDを設定してください</p>
          </div>

          <div>
            <Label htmlFor="scheduleName">スケジュール名 *</Label>
            <Input
              id="scheduleName"
              value={newSchedule.name || ''}
              onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              placeholder="例: 2時間前, 15分前リマインド"
            />
          </div>

          <div>
            <Label htmlFor="hoursBefore">何時間前 *</Label>
            <Input
              id="hoursBefore"
              type="number"
              min="0.5"
              max="168"
              step="0.5"
              value={newSchedule.timingHours || 1}
              onChange={(e) => setNewSchedule({ ...newSchedule, timingHours: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">
              • 0.5〜168時間（1週間）の範囲で設定
              <br />• 0.5 = 30分、1 = 1時間、24 = 1日
            </p>
          </div>

          <div>
            <Label htmlFor="messageText">メッセージテンプレート *</Label>
            <Textarea
              id="messageText"
              value={newSchedule.messageTemplate || ''}
              onChange={(e) => setNewSchedule({ ...newSchedule, messageTemplate: e.target.value })}
              rows={4}
              placeholder="例: 【まもなくレッスン開始】&#10;&#10;{program}&#10;📅 {date}&#10;⏰ {time}&#10;👨‍🏫 {instructor}&#10;🏢 {studio}&#10;&#10;準備はOKですか？✨"
            />
            <p className="text-xs text-gray-500 mt-1">
              📝 使用可能な変数: <code>{'{date}'}</code>, <code>{'{time}'}</code>, <code>{'{program}'}</code>, <code>{'{instructor}'}</code>, <code>{'{studio}'}</code>
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={addCustomSchedule} className="bg-blue-600 hover:bg-blue-700">
              ✅ 追加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 