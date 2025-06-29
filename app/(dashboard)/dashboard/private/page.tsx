import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/auth/signin/actions'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              認証済みページ
            </h1>
            <p className="text-gray-600 mb-4">
              こんにちは、<span className="font-medium">{data.user.email}</span>さん！
            </p>
            <p className="text-sm text-gray-500 mb-6">
              このページは認証されたユーザーのみがアクセスできます。
            </p>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800">
                  ✅ 認証成功
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Supabase Auth with Next.js App Routerが正常に動作しています。
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800">
                  📋 ユーザー情報
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>User ID: {data.user.id}</p>
                  <p>Email: {data.user.email}</p>
                  <p>Email確認済み: {data.user.email_confirmed_at ? '✅' : '❌'}</p>
                  <p>最終ログイン: {data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString('ja-JP') : '不明'}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <a
                  href="/dashboard"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  ダッシュボードに戻る
                </a>
                <form action={signout} className="inline">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    サインアウト
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 