'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { usePrograms } from '@/hooks/usePrograms'
import { useInstructors } from '@/hooks/useInstructors'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Activity, 
  Dumbbell,
  User,
  Clock,
  Mail,
  Phone
} from 'lucide-react'

interface ProgramForm {
  name: string
  description: string
  color_class: string
  text_color_class: string
  default_instructor_id?: number
}

interface InstructorForm {
  name: string
  email: string
  phone: string
  bio: string
  specialties: string[]
}

export default function ProgramsInstructorsPage() {
  const { programs, loading: programsLoading, error: programsError, refetch: refetchPrograms } = usePrograms()
  const { instructors, loading: instructorsLoading, error: instructorsError, refetch: refetchInstructors } = useInstructors()
  
  const [activeTab, setActiveTab] = useState<'programs' | 'instructors'>('programs')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'program' | 'instructor'>('program')
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // フォーム状態
  const [programForm, setProgramForm] = useState<ProgramForm>({
    name: '',
    description: '',
    color_class: 'bg-blue-500',
    text_color_class: 'text-white',
    default_instructor_id: undefined
  })
  
  const [instructorForm, setInstructorForm] = useState<InstructorForm>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: []
  })

  const handleAddProgram = () => {
    setModalType('program')
    setEditingItem(null)
    setProgramForm({
      name: '',
      description: '',
      color_class: 'bg-blue-500',
      text_color_class: 'text-white',
      default_instructor_id: undefined
    })
    setIsModalOpen(true)
  }

  const handleAddInstructor = () => {
    setModalType('instructor')
    setEditingItem(null)
    setInstructorForm({
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialties: []
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (modalType === 'program') {
        // プログラム作成/更新の処理
        const response = await fetch('/api/programs', {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem ? { ...programForm, id: editingItem.id } : programForm)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'プログラムの保存に失敗しました')
        }
        
        // データの再取得
        await refetchPrograms()
      } else {
        // インストラクター作成/更新の処理
        const response = await fetch('/api/instructors', {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem ? { ...instructorForm, id: editingItem.id } : instructorForm)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'インストラクターの保存に失敗しました')
        }
        
        // データの再取得
        await refetchInstructors()
      }
      
      setIsModalOpen(false)
      setEditingItem(null)
      
      // 成功メッセージ
      alert(editingItem 
        ? `${modalType === 'program' ? 'プログラム' : 'インストラクター'}が更新されました`
        : `${modalType === 'program' ? 'プログラム' : 'インストラクター'}が作成されました`
      )
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
    { value: 'bg-indigo-500', label: 'インディゴ' }
  ]

  // インストラクター情報を取得する関数
  const getInstructorById = (id: number) => {
    return instructors.find(instructor => instructor.id === id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プログラム・インストラクター管理</h1>
        <p className="text-muted-foreground">
          レッスンプログラムとインストラクター情報を管理します
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'programs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="inline w-4 h-4 mr-2" />
          プログラム管理
        </button>
        <button
          onClick={() => setActiveTab('instructors')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'instructors'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Dumbbell className="inline w-4 h-4 mr-2" />
          インストラクター管理
        </button>
      </div>

      {/* プログラム管理タブ */}
      {activeTab === 'programs' && (
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
              {programs.map((program) => {
                const defaultInstructor = program.default_instructor_id ? getInstructorById(program.default_instructor_id) : null
                
                return (
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
                            onClick={() => {
                              setEditingItem(program)
                              setProgramForm({
                                name: program.name,
                                description: program.description || '',
                                color_class: program.color_class,
                                text_color_class: program.text_color_class,
                                default_instructor_id: program.default_instructor_id
                              })
                              setModalType('program')
                              setIsModalOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {defaultInstructor && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-1" />
                            {defaultInstructor.name}
                          </div>
                        )}
                        <p className="text-sm text-gray-700">{program.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* インストラクター管理タブ */}
      {activeTab === 'instructors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">インストラクター一覧</h2>
            <Button onClick={handleAddInstructor}>
              <Plus className="w-4 h-4 mr-2" />
              新規インストラクター追加
            </Button>
          </div>

          {instructorsLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : instructorsError ? (
            <div className="text-center py-8 text-red-500">エラー: {instructorsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((instructor) => (
                <Card key={instructor.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-medium">
                        {instructor.name}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(instructor)
                            setInstructorForm({
                              name: instructor.name,
                              email: instructor.email || '',
                              phone: instructor.phone || '',
                              bio: instructor.bio || '',
                              specialties: instructor.specialties || []
                            })
                            setModalType('instructor')
                            setIsModalOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-1" />
                        {instructor.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        {instructor.phone}
                      </div>
                      <p className="text-sm text-gray-700">{instructor.bio}</p>
                      {instructor.specialties && instructor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {instructor.specialties.map((specialty: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* モーダル */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'program' 
          ? (editingItem ? 'プログラム編集' : '新規プログラム追加')
          : (editingItem ? 'インストラクター編集' : '新規インストラクター追加')
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalType === 'program' ? (
            <>
              <div>
                <Label htmlFor="program-name">プログラム名</Label>
                <Input
                  id="program-name"
                  value={programForm.name}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="program-description">説明</Label>
                <Textarea
                  id="program-description"
                  value={programForm.description}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="default-instructor">デフォルトインストラクター（任意）</Label>
                <select
                  id="default-instructor"
                  value={programForm.default_instructor_id?.toString() || ''}
                  onChange={(e) => setProgramForm(prev => ({ 
                    ...prev, 
                    default_instructor_id: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">インストラクターを選択（任意）</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  このプログラムでよく担当するインストラクターを設定できます
                </p>
              </div>
              
              <div>
                <Label htmlFor="program-color">カラー</Label>
                <select
                  id="program-color"
                  value={programForm.color_class}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, color_class: e.target.value }))}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="instructor-name">インストラクター名</Label>
                <Input
                  id="instructor-name"
                  value={instructorForm.name}
                  onChange={(e) => setInstructorForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="instructor-email">メールアドレス</Label>
                <Input
                  id="instructor-email"
                  type="email"
                  value={instructorForm.email}
                  onChange={(e) => setInstructorForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="instructor-phone">電話番号</Label>
                <Input
                  id="instructor-phone"
                  value={instructorForm.phone}
                  onChange={(e) => setInstructorForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="instructor-bio">プロフィール</Label>
                <Textarea
                  id="instructor-bio"
                  value={instructorForm.bio}
                  onChange={(e) => setInstructorForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="instructor-specialties">専門分野（カンマ区切り）</Label>
                <Input
                  id="instructor-specialties"
                  value={instructorForm.specialties.join(', ')}
                  onChange={(e) => setInstructorForm(prev => ({ 
                    ...prev, 
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  placeholder="例: ヨガ, ピラティス, HIIT"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {editingItem ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
} 