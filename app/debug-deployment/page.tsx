'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function DebugDeployment() {
  const [deploymentInfo, setDeploymentInfo] = useState<any>({})

  useEffect(() => {
    const info = {
      currentUrl: window.location.href,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
      },
      buildInfo: {
        builtAt: new Date().toISOString(),
        lastCommit: 'cf22a26 - Google OAuth認証リダイレクトの一時的修正',
        hasRedirectFix: true // 一時的な修正が含まれているかのフラグ
      }
    }
    setDeploymentInfo(info)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 デプロイ診断ページ</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">現在の環境情報</h2>
          <div className="space-y-2 text-sm">
            <div><strong>URL:</strong> {deploymentInfo.currentUrl}</div>
            <div><strong>Origin:</strong> {deploymentInfo.origin}</div>
            <div><strong>タイムスタンプ:</strong> {deploymentInfo.timestamp}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">環境変数</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Supabase URL:</strong> {deploymentInfo.environment?.supabaseUrl}</div>
            <div><strong>Supabase Anon Key:</strong> {deploymentInfo.environment?.supabaseAnonKey}</div>
            <div><strong>NODE_ENV:</strong> {deploymentInfo.environment?.nodeEnv}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">ビルド情報</h2>
          <div className="space-y-2 text-sm">
            <div><strong>最新コミット:</strong> {deploymentInfo.buildInfo?.lastCommit}</div>
            <div><strong>一時的修正:</strong> {deploymentInfo.buildInfo?.hasRedirectFix ? '✅ 含まれています' : '❌ 含まれていません'}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Google認証テスト</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                const testUrl = `${window.location.origin}/auth/callback?code=test&next=%2Fdashboard`
                console.log('テスト用コールバックURL:', testUrl)
                alert(`生成されるコールバックURL: ${testUrl}`)
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              コールバックURL生成テスト
            </button>
            
            <button
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search)
                const code = urlParams.get('code')
                alert(`現在のURLにcodeパラメータ: ${code || 'なし'}`)
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              現在のcodeパラメータ確認
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-700">← ホームページに戻る</a>
        </div>
      </div>
    </div>
  )
} 