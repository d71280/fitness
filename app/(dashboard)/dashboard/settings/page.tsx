// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, TestTube, Save, Eye, EyeOff, Mail, Smartphone, AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'


interface ConnectionSettings {
  appBaseUrl: string
  lineChannelAccessToken: string
  lineChannelSecret: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ConnectionSettings>({
    appBaseUrl: '',
    lineChannelAccessToken: '',
    lineChannelSecret: '',
  })

  const [googleSheetsSettings, setGoogleSheetsSettings] = useState({
    spreadsheetId: '',
    lineGroupToken: '',
    enabled: false
  })

  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [testResults, setTestResults] = useState<{
    sheets?: boolean
    lineGroup?: boolean
    lineOfficial?: boolean | null
  }>({
    sheets: undefined,
    lineGroup: undefined,
    lineOfficial: null
  })
  const [showSecrets, setShowSecrets] = useState(false)




  // 設定読み込み
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      console.log('設定を読み込み中...')
      
      // まずローカルストレージから読み込み
      try {
        const localSettings = localStorage.getItem('fitness-app-settings')
        if (localSettings) {
          const parsed = JSON.parse(localSettings)
          console.log('✅ ローカルストレージから設定を読み込みました:', parsed)
          
          setGoogleSheetsSettings(prev => ({
            ...prev,
            enabled: parsed.spreadsheetEnabled || false,
            spreadsheetId: parsed.spreadsheetId || prev.spreadsheetId,
            lineGroupToken: parsed.lineGroupToken || prev.lineGroupToken
          }))
          
          // グローバル設定にも保存
          window.fitnessAppSettings = parsed
        } else {
          console.log('ローカルストレージに設定が見つかりません')
        }
      } catch (storageError) {
        console.warn('ローカルストレージ読み込みエラー:', storageError)
      }

      // 環境変数から基本設定を読み込み
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          console.log('サーバー設定データ:', data)
          
          if (data.success && data.connection) {
            setSettings({
              appBaseUrl: data.connection.appBaseUrl || '',
              lineChannelAccessToken: data.connection.lineChannelAccessToken || '',
              lineChannelSecret: data.connection.lineChannelSecret || '',
            })
          }
          
          // サーバーからのスプレッドシートIDがある場合は設定
          if (data.success && data.googleSheets?.spreadsheetId) {
            setGoogleSheetsSettings(prev => ({
              ...prev,
              spreadsheetId: data.googleSheets.spreadsheetId
            }))
          }
        }
      } catch (apiError) {
        console.warn('API設定読み込みエラー:', apiError)
      }

    } catch (error) {
      console.error('設定読み込みエラー:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      console.log('設定保存開始:', { enabled: googleSheetsSettings.enabled })
      
      // ローカルストレージに直接保存（確実な方法）
      const settingsToSave = {
        spreadsheetEnabled: googleSheetsSettings.enabled,
        spreadsheetId: googleSheetsSettings.spreadsheetId,
        lineGroupToken: googleSheetsSettings.lineGroupToken,
        updatedAt: new Date().toISOString()
      }
      
      try {
        localStorage.setItem('fitness-app-settings', JSON.stringify(settingsToSave))
        console.log('✅ ローカルストレージに設定を保存しました:', settingsToSave)
        
        // グローバル設定として window オブジェクトにも保存（確実性向上）
        window.fitnessAppSettings = settingsToSave
        
        alert('設定が保存されました！')
      } catch (storageError) {
        console.error('ローカルストレージ保存エラー:', storageError)
        alert('設定の保存に失敗しました')
      }
      
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert(`設定保存でエラーが発生しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testGoogleSheets = async () => {
    setLoading(true)
    try {
      // クライアントサイドで直接Google Sheetsクライアントをテスト
      const { GoogleSheetsClient } = await import('@/lib/google-sheets')
      const sheetsClient = new GoogleSheetsClient(googleSheetsSettings.spreadsheetId)
      
      const result = await sheetsClient.testConnection()
      setTestResults(prev => ({ ...prev, sheets: result.success }))
      
      if (result.success) {
        alert(`Google Sheets接続テストが成功しました！\n\nスプレッドシート: ${result.spreadsheetTitle}\nシート数: ${result.sheetCount}`)
      } else {
        alert(`Google Sheets接続テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('Google Sheets接続テストエラー:', error)
      setTestResults(prev => ({ ...prev, sheets: false }))
      alert(`Google Sheets接続テストに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const testSheetsServiceAccount = async () => {
    setLoading(true)
    try {
      console.log('サービスアカウントでGoogle Sheets書き込みテストを開始...')
      
      const response = await fetch('/api/test-sheets-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('サービスアカウントAPI応答:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('サービスアカウントAPI応答エラー:', errorText)
        alert(`❌ サービスアカウントAPI呼び出し失敗 (${response.status}):\n\n${errorText}`)
        return
      }
      
      const result = await response.json()
      console.log('サービスアカウント書き込みテスト結果:', result)
      
      if (result.success) {
        alert(`✅ サービスアカウントでスプレッドシート書き込み成功！\n\n書き込みデータ: ${result.testData.join(', ')}\n\nスプレッドシートを確認してください。`)
      } else {
        alert(`❌ サービスアカウントテスト失敗:\n\n${result.error}`)
      }
    } catch (error) {
      console.error('サービスアカウントテストエラー:', error)
      alert(`サービスアカウントテストでエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const testSheetsWrite = async () => {
    setLoading(true)
    try {
      console.log('Google Sheets書き込みテストを開始...')
      
      const response = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('API応答:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API応答エラー:', errorText)
        alert(`❌ API呼び出し失敗 (${response.status}):\n\n${errorText}`)
        return
      }
      
      const result = await response.json()
      console.log('書き込みテスト結果:', result)
      
      if (result.success) {
        alert(`✅ スプレッドシート書き込みテスト成功！\n\n書き込みデータ: ${result.testData.join(', ')}\n\nスプレッドシートを確認してください。`)
      } else {
        alert(`❌ スプレッドシート書き込みテスト失敗:\n\n${result.error}`)
      }
    } catch (error) {
      console.error('書き込みテストエラー:', error)
      alert(`書き込みテストでエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const testLineNotification = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=line-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetsSettings)
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, lineGroup: result.success }))
      
      if (result.success) {
        alert('グループLINE通知テストが成功しました')
      } else {
        alert(`グループLINE通知テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('グループLINE通知テストエラー:', error)
      setTestResults(prev => ({ ...prev, lineGroup: false }))
      alert('グループLINE通知テストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const testLineOfficial = async () => {
    setLoading(true)
    setTestResults(prev => ({ ...prev, lineOfficial: null }))
    
    try {
      const response = await fetch('/api/test-connection?type=line-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      setTestResults(prev => ({ ...prev, lineOfficial: data.success }))
      
      if (data.success) {
        alert(`LINE接続テスト成功！\nBot名: ${data.data?.displayName || '不明'}`)
      } else {
        alert(`LINE接続テスト失敗: ${data.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, lineOfficial: false }))
      alert('接続テストでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }



  const updateSetting = (key: keyof ConnectionSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateGoogleSheetsSetting = (key: string, value: any) => {
    setGoogleSheetsSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const maskString = (str: string) => {
    if (!str || str.length <= 8) return str
    const start = str.substring(0, 4)
    const end = str.substring(str.length - 4)
    return `${start}${'*'.repeat(str.length - 8)}${end}`
  }



  
  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <div className="text-lg">設定読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">システム設定</h1>
        <p className="text-gray-600">
          アプリケーション設定とスプレッドシート連携を管理します
        </p>
      </div>

      {/* アプリケーション設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            アプリケーション設定
          </CardTitle>
          <CardDescription>
            基本的なアプリケーション設定
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="appBaseUrl">アプリベースURL</Label>
            <Input
              id="appBaseUrl"
              value={settings.appBaseUrl}
              onChange={(e) => updateSetting('appBaseUrl', e.target.value)}
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              このアプリケーションのベースURL
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LINE公式アカウント設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            LINE公式アカウント連携
          </CardTitle>
          <CardDescription>
            LINE Messaging API設定とLIFF設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lineChannelAccessToken">チャンネルアクセストークン</Label>
            <div className="relative">
              <Input
                id="lineChannelAccessToken"
                type={showSecrets ? 'text' : 'password'}
                value={settings.lineChannelAccessToken}
                onChange={(e) => updateSetting('lineChannelAccessToken', e.target.value)}
                placeholder="LINE Developers > Messaging API > チャンネルアクセストークン"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="lineChannelSecret">チャンネルシークレット</Label>
            <Input
              id="lineChannelSecret"
              type={showSecrets ? 'text' : 'password'}
              value={settings.lineChannelSecret}
              onChange={(e) => updateSetting('lineChannelSecret', e.target.value)}
              placeholder="LINE Developers > Basic settings > チャンネルシークレット"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={testLineOfficial}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {loading ? '接続テスト中...' : 'LINE接続テスト'}
            </Button>
            {testResults.lineOfficial !== null && (
              <div className={`px-3 py-2 rounded-md text-sm ${
                testResults.lineOfficial 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.lineOfficial ? '✓ 接続成功' : '✗ 接続失敗'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* スプレッドシート & グループLINE連携設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-500" />
            スプレッドシート & グループLINE連携
          </CardTitle>
          <CardDescription>
            予約情報をGoogle Sheetsに記録し、グループLINEに通知を送信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-sheets">スプレッドシート連携を有効にする</Label>
              <p className="text-xs text-gray-500 mt-1">
                予約完了時に自動でスプレッドシートに記録されます
              </p>
            </div>
            <Switch
              id="enable-sheets"
              checked={googleSheetsSettings.enabled}
              onCheckedChange={(checked) => updateGoogleSheetsSetting('enabled', checked)}
            />
          </div>

          {googleSheetsSettings.enabled && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <strong className="text-blue-800">OAuth2.0認証を使用</strong>
                </div>
                <p className="text-sm text-blue-700">
                  Googleでログインした時の認証情報を使用してスプレッドシートに書き込みます。
                  サービスアカウントの設定は不要です。
                </p>
              </div>

              <div>
                <Label htmlFor="spreadsheetId">スプレッドシートID</Label>
                <Input
                  id="spreadsheetId"
                  value={googleSheetsSettings.spreadsheetId}
                  onChange={(e) => updateGoogleSheetsSetting('spreadsheetId', e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google SheetsのURLから取得: https://docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
                  <br />
                  <strong>重要:</strong> ログインしたGoogleアカウントがこのスプレッドシートに編集権限を持っている必要があります
                </p>
              </div>

              <div>
                <Label htmlFor="lineGroupToken">グループLINE Botアクセストークン</Label>
                <Input
                  id="lineGroupToken"
                  type={showSecrets ? 'text' : 'password'}
                  value={showSecrets ? googleSheetsSettings.lineGroupToken : maskString(googleSheetsSettings.lineGroupToken)}
                  onChange={(e) => updateGoogleSheetsSetting('lineGroupToken', e.target.value)}
                  placeholder="グループ通知用のLINE Botトークン"
                />
                <p className="text-xs text-gray-500 mt-1">
                  事業者グループ通知用のLINE Botアクセストークン（Google Apps Scriptで使用）
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={testGoogleSheets}
                  disabled={loading || !googleSheetsSettings.spreadsheetId}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  📊 スプレッドシート接続テスト
                </Button>
                <Button
                  onClick={testSheetsWrite}
                  disabled={loading}
                  variant="outline"
                  className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  ✏️ OAuth書き込みテスト
                </Button>
                <Button
                  onClick={testSheetsServiceAccount}
                  disabled={loading}
                  variant="outline"
                  className="w-full sm:w-auto bg-green-50 hover:bg-green-100"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  🔑 サービスアカウントテスト
                </Button>
                {testResults.sheets !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    testResults.sheets ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {testResults.sheets ? '✓ 成功' : '✗ 失敗'}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={testLineNotification}
                  disabled={loading || !googleSheetsSettings.lineGroupToken}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  💬 グループLINE通知テスト
                </Button>
                {testResults.lineGroup !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    testResults.lineGroup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {testResults.lineGroup ? '✓ 成功' : '✗ 失敗'}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>



      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          設定を保存
        </Button>
      </div>


    </div>
  )
}