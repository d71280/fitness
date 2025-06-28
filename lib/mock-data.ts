// 開発用のモックデータ（データベースが使用できない場合の代替）

export const mockSchedules = {
  '2025-06-16': [
    {
      id: 1,
      time: '10:00 - 11:00',
      program: 'ヨガ',
      instructor: '田中 美香',
      studio: 'スタジオ1',
      capacity: 20,
      booked: 15,
      color: 'bg-green-500',
      textColor: 'text-white',
    },
    {
      id: 2,
      time: '14:00 - 14:45',
      program: 'ピラティス',
      instructor: '山田 さくら',
      studio: 'スタジオ2',
      capacity: 15,
      booked: 12,
      color: 'bg-purple-500',
      textColor: 'text-white',
    },
  ],
  '2025-06-17': [
    {
      id: 3,
      time: '09:00 - 10:00',
      program: 'HIIT',
      instructor: '佐藤 健太',
      studio: 'スタジオ1',
      capacity: 25,
      booked: 20,
      color: 'bg-orange-500',
      textColor: 'text-white',
    },
    {
      id: 4,
      time: '19:00 - 20:00',
      program: 'ズンバ',
      instructor: '佐藤 健太',
      studio: 'スタジオ1',
      capacity: 30,
      booked: 28,
      color: 'bg-red-500',
      textColor: 'text-white',
    },
  ],
  '2025-06-18': [
    {
      id: 5,
      time: '11:00 - 12:00',
      program: 'ヨガ',
      instructor: '田中 美香',
      studio: 'スタジオ1',
      capacity: 20,
      booked: 18,
      color: 'bg-green-500',
      textColor: 'text-white',
    },
  ],
  '2025-06-19': [
    {
      id: 6,
      time: '18:00 - 18:45',
      program: 'ピラティス',
      instructor: '山田 さくら',
      studio: 'スタジオ2',
      capacity: 15,
      booked: 15,
      color: 'bg-purple-500',
      textColor: 'text-white',
    },
  ],
}

export const mockPrograms = [
  {
    id: 1,
    name: 'ヨガ',
    color_class: 'bg-green-500',
    text_color_class: 'text-white',
    default_duration: 60,
    description: 'リラックス効果のあるヨガクラス',
  },
  {
    id: 2,
    name: 'ピラティス',
    color_class: 'bg-purple-500',
    text_color_class: 'text-white',
    default_duration: 45,
    description: 'コア強化に特化したピラティス',
  },
  {
    id: 3,
    name: 'ズンバ',
    color_class: 'bg-red-500',
    text_color_class: 'text-white',
    default_duration: 60,
    description: 'ダンスフィットネス',
  },
  {
    id: 4,
    name: 'HIIT',
    color_class: 'bg-orange-500',
    text_color_class: 'text-white',
    default_duration: 30,
    description: '高強度インターバルトレーニング',
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

export const mockStudios = [
  {
    id: 1,
    name: 'スタジオ1',
    capacity: 30,
    equipment: ['ヨガマット', 'ダンベル', '音響設備'],
    description: 'メインスタジオ',
  },
  {
    id: 2,
    name: 'スタジオ2',
    capacity: 20,
    equipment: ['ヨガマット', 'ピラティスボール', '音響設備'],
    description: 'サブスタジオ',
  },
]