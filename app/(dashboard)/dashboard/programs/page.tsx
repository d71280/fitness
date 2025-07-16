'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { usePrograms } from '@/hooks/usePrograms'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Activity
} from 'lucide-react'

interface ProgramForm {
  name: string
  description: string
  color_class: string
  text_color_class: string
}

export default function ProgramsPage() {
  const { programs, loading: programsLoading, error: programsError, refetch: refetchPrograms } = usePrograms()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // フォーム状態
  const [programForm, setProgramForm] = useState<ProgramForm>({
    name: '',
    description: '',
    color_class: 'bg-blue-500',
    text_color_class: 'text-white'
  })

  const handleAddProgram = () => {
    setEditingItem(null)
    setProgramForm({
      name: '',
      description: '',
      color_class: 'bg-blue-500',
      text_color_class: 'text-white'
    })
    setIsModalOpen(true)
  }

  const handleEditProgram = (program: any) => {
    setEditingItem(program)
    setProgramForm({
      name: program.name,
      description: program.description || '',
      color_class: program.color_class,
      text_color_class: program.text_color_class
    })
    setIsModalOpen(true)
  }

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm('このプログラムを削除しますか？関連するスケジュールも削除されます。')) {
      return
    }

    try {
      const response = await fetch(`/api/programs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: programId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'プログラムの削除に失敗しました')
      }

      await refetchPrograms()
      alert('プログラムが削除されました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert(error instanceof Error ? error.message : '削除に失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/programs', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...programForm, id: editingItem.id } : programForm)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'プログラムの保存に失敗しました')
      }
      
      await refetchPrograms()
      setIsModalOpen(false)
      setEditingItem(null)
      
      alert(editingItem ? 'プログラムが更新されました' : 'プログラムが作成されました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert(error instanceof Error ? error.message : '保存に失敗しました')
    }
  }

  const colorOptions = [
    { value: 'bg-blue-500', label: 'ブルー' },
    { value: 'bg-green-500', label: 'グリーン' },
    { value: 'bg-purple-500', label: 'パープル' },
    { value: 'bg-red-500', label: 'レッド' },
    { value: 'bg-orange-500', label: 'オレンジ' },
    { value: 'bg-pink-500', label: 'ピンク' },
    { value: 'bg-yellow-500', label: 'イエロー' },
    { value: 'bg-indigo-500', label: 'インディゴ' },
    // PDFスケジュールのカラーパレットを追加
    { value: 'bg-cyan-400', label: 'シアン' },
    { value: 'bg-emerald-400', label: 'エメラルド' },
    { value: 'bg-fuchsia-400', label: 'フューシャ' },
    { value: 'bg-amber-400', label: 'アンバー' },
    { value: 'bg-stone-400', label: 'ストーン' },
    { value: 'bg-slate-300', label: 'スレート' },
    { value: 'bg-teal-500', label: 'ティール' },
    { value: 'bg-rose-400', label: 'ローズ' }
  ]

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プログラム管理</h1>
        <p className="text-muted-foreground">
          レッスンプログラムを管理します
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">プログラム一覧</h2>
          <Button onClick={handleAddProgram}>
            <Plus className="w-4 h-4 mr-2" />
            新規プログラム追加
          </Button>
        </div>

        {programsLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : programsError ? (
          <div className="text-center py-8 text-red-500">エラー: {programsError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${program.color_class} ${program.text_color_class}`}>
                      {program.name}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProgram(program)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => handleDeleteProgram(program.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {program.description && (
                      <p className="text-sm text-gray-600">{program.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* プログラム作成/編集モーダル */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'プログラム編集' : '新規プログラム作成'}
      >
        <div className="p-6">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">プログラム名</Label>
              <Input
                id="name"
                type="text"
                value={programForm.name}
                onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                required
                placeholder="プログラム名を入力"
              />
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={programForm.description}
                onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                placeholder="プログラムの詳細説明"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">表示色</Label>
              <div className="grid grid-cols-4 gap-2 mt-2 max-h-32 overflow-y-auto">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProgramForm({ 
                      ...programForm, 
                      color_class: option.value,
                      text_color_class: 'text-white'
                    })}
                    className={`p-3 rounded-md text-sm font-medium text-white ${option.value} ${
                      programForm.color_class === option.value ? 'ring-2 ring-gray-400' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit">
                {editingItem ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
} 