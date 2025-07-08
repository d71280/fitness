import { Program, Schedule, Reservation } from '@/types/api'

// 開発用のモックデータ（データベースが使用できない場合の代替）

export const mockSchedules: Schedule[] = [
  {
    id: 1,
    date: '2025-01-06',
    startTime: '10:00',
    endTime: '11:00',
    programId: 1,
    capacity: 30,
  },
  {
    id: 2,
    date: '2025-01-06',
    startTime: '11:00',
    endTime: '12:00',
    programId: 2,
    capacity: 20,
  },
  {
    id: 3,
    date: '2025-01-06',
    startTime: '14:00',
    endTime: '14:45',
    programId: 3,
    capacity: 25,
  },
  {
    id: 4,
    date: '2025-01-06',
    startTime: '18:00',
    endTime: '18:30',
    programId: 4,
    capacity: 30,
  },
  {
    id: 5,
    date: '2025-01-07',
    startTime: '10:00',
    endTime: '11:00',
    programId: 1,
    capacity: 30,
  },
  {
    id: 6,
    date: '2025-01-07',
    startTime: '11:00',
    endTime: '12:00',
    programId: 4,
    capacity: 30,
  },
]

export const mockReservations: Reservation[] = [
  {
    id: 1,
    scheduleId: 1,
    userId: 'user1',
    userName: '田中花子',
    userEmail: 'hanako@example.com',
    userPhone: '090-1234-5678',
    reservedAt: '2025-01-05T15:30:00Z',
  },
  {
    id: 2,
    scheduleId: 1,
    userId: 'user2',
    userName: '佐藤太郎',
    userEmail: 'taro@example.com',
    reservedAt: '2025-01-05T16:00:00Z',
  },
  {
    id: 3,
    scheduleId: 2,
    userId: 'user3',
    userName: '鈴木一郎',
    userEmail: 'ichiro@example.com',
    userPhone: '080-9876-5432',
    reservedAt: '2025-01-05T17:00:00Z',
  },
]

export const mockPrograms: Program[] = [
  {
    id: 1,
    name: 'ヨガ',
    description: 'リラックスできるヨガクラス',
    duration: 60,
    capacity: 20,
    color: '#10B981',
    color_class: 'bg-green-500',
    text_color_class: 'text-white',
  },
  {
    id: 2,
    name: 'HIIT',
    description: '高強度インターバルトレーニング',
    duration: 30,
    capacity: 15,
    color: '#F97316',
    color_class: 'bg-orange-500',
    text_color_class: 'text-white',
  },
  {
    id: 3,
    name: 'ピラティス',
    description: 'コア強化のピラティスクラス',
    duration: 45,
    capacity: 12,
    color: '#8B5CF6',
    color_class: 'bg-purple-500',
    text_color_class: 'text-white',
  },
  {
    id: 4,
    name: 'ダンス',
    description: 'リズミカルなダンスクラス',
    duration: 60,
    capacity: 25,
    color: '#EF4444',
    color_class: 'bg-red-500',
    text_color_class: 'text-white',
  },
  {
    id: 5,
    name: 'RPM45',
    description: '高強度サイクリングワークアウト',
    duration: 45,
    capacity: 20,
    color: '#06B6D4',
    color_class: 'bg-cyan-500',
    text_color_class: 'text-white',
  },
]

export const mockInstructors = [
  {
    id: 1,
    name: '田中 美香',
    email: 'mika.tanaka@studio.com',
    specialties: ['ヨガ', 'ピラティス'],
    bio: 'ヨガインストラクター歴10年のベテラン講師',
  },
  {
    id: 2,
    name: '佐藤 健太',
    email: 'kenta.sato@studio.com',
    specialties: ['HIIT', 'ズンバ'],
    bio: 'エネルギッシュなレッスンが人気の講師',
  },
  {
    id: 3,
    name: '山田 さくら',
    email: 'sakura.yamada@studio.com',
    specialties: ['ピラティス', 'ヨガ'],
    bio: '丁寧な指導で初心者にも人気',
  },
]