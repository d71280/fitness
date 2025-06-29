export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            認証中にエラーが発生しました。
          </p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>• メールアドレスとパスワードを確認してください</p>
            <p>• メール確認リンクが期限切れの可能性があります</p>
            <p>• 再度サインインを試してください</p>
          </div>
          <div className="mt-6">
            <a
              href="/auth/signin"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              サインインページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 