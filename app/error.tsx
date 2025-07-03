'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">エラーが発生しました</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 mb-2">
            <strong>エラーメッセージ:</strong>
          </p>
          <p className="text-xs text-red-700 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
          <a
            href="/"
            className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  )
}