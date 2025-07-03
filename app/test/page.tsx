'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">シンプルテストページ</h1>
        <p className="text-gray-600">このページが表示されれば基本的な動作は問題ありません</p>
        <div className="mt-8">
          <a 
            href="https://liff.line.me/2007611355-VOqXANop"
            className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-green-700"
          >
            LIFFアプリを開く
          </a>
        </div>
      </div>
    </div>
  )
}