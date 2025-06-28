// モックデータベース実装（ビルドエラー回避のため）
// 将来的にSupabaseまたは実際のデータベースに置き換え予定

interface MockDatabase {
  programs: any[]
  instructors: any[]
  studios: any[]
  schedules: any[]
  reservations: any[]
  customers: any[]
  notificationLog: any[]
}

// モックデータ
const mockData: MockDatabase = {
  programs: [
    { id: 1, name: 'ヨガ', description: 'リラックスヨガクラス', duration: 60, capacity: 15 },
    { id: 2, name: 'ピラティス', description: 'コアトレーニング', duration: 45, capacity: 12 },
    { id: 3, name: 'ズンバ', description: 'ダンスフィットネス', duration: 60, capacity: 20 }
  ],
  instructors: [
    { id: 1, name: '田中 美香', specialties: ['ヨガ', 'ピラティス'] },
    { id: 2, name: '鈴木 健太', specialties: ['ズンバ', 'エアロビクス'] },
    { id: 3, name: '佐藤 由美', specialties: ['ヨガ', 'ストレッチ'] }
  ],
  studios: [
    { id: 1, name: 'スタジオ1', capacity: 20, equipment: ['ヨガマット', 'ボール'] },
    { id: 2, name: 'スタジオ2', capacity: 15, equipment: ['ダンベル', 'マット'] }
  ],
  schedules: [
    {
      id: 1,
      program_id: 1,
      instructor_id: 1,
      studio_id: 1,
      date: new Date('2024-01-20'),
      start_time: '10:00',
      end_time: '11:00',
      capacity: 15,
      booked_count: 5
    }
  ],
  reservations: [
    {
      id: 1,
      schedule_id: 1,
      customer_id: 1,
      status: 'confirmed',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  customers: [
    {
      id: 1,
      name: '山田 太郎',
      line_id: 'mock_line_id_1',
      email: 'yamada@example.com',
      phone: '090-1234-5678'
    }
  ],
  notificationLog: []
}

// モック操作を実装
const createMockFindMany = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: findMany on ${tableName}`, options)
    return mockData[tableName] || []
  }
}

const createMockFindUnique = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: findUnique on ${tableName}`, options)
    const data = mockData[tableName] || []
    return data[0] || null
  }
}

const createMockCreate = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: create on ${tableName}`, options)
    const newItem = {
      id: Math.floor(Math.random() * 10000),
      ...options?.data,
      created_at: new Date(),
      updated_at: new Date()
    }
    mockData[tableName].push(newItem)
    return newItem
  }
}

const createMockUpdate = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: update on ${tableName}`, options)
    const data = mockData[tableName] || []
    const item = data[0] || {}
    return { ...item, ...options?.data, updated_at: new Date() }
  }
}

const createMockDelete = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: delete on ${tableName}`, options)
    const data = mockData[tableName] || []
    return data[0] || null
  }
}

const createMockUpsert = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: upsert on ${tableName}`, options)
    const data = mockData[tableName] || []
    const existingItem = data.find((item: any) => 
      options?.where && Object.keys(options.where).every(key => 
        item[key] === options.where[key]
      )
    )
    
    if (existingItem) {
      // Update existing item
      Object.assign(existingItem, options?.update || {}, { updated_at: new Date() })
      return existingItem
    } else {
      // Create new item
      const newItem = {
        id: Math.floor(Math.random() * 10000),
        ...options?.create,
        created_at: new Date(),
        updated_at: new Date()
      }
      mockData[tableName].push(newItem)
      return newItem
    }
  }
}

const createMockFindFirst = (tableName: keyof MockDatabase) => {
  return async (options?: any) => {
    console.log(`Mock DB: findFirst on ${tableName}`, options)
    const data = mockData[tableName] || []
    if (options?.where) {
      return data.find((item: any) => 
        Object.keys(options.where).every(key => 
          item[key] === options.where[key]
        )
      ) || null
    }
    return data[0] || null
  }
}

// モックPrismaクライアント
export const prisma = {
  // トランザクション機能のモック実装
  $transaction: async (operations: any[]) => {
    console.log('Mock DB: $transaction with', operations.length, 'operations')
    const results = []
    for (const operation of operations) {
      const result = await operation
      results.push(result)
    }
    return results
  },
  program: {
    findMany: createMockFindMany('programs'),
    findUnique: createMockFindUnique('programs'),
    findFirst: createMockFindFirst('programs'),
    create: createMockCreate('programs'),
    update: createMockUpdate('programs'),
    delete: createMockDelete('programs'),
    upsert: createMockUpsert('programs')
  },
  instructor: {
    findMany: createMockFindMany('instructors'),
    findUnique: createMockFindUnique('instructors'),
    findFirst: createMockFindFirst('instructors'),
    create: createMockCreate('instructors'),
    update: createMockUpdate('instructors'),
    delete: createMockDelete('instructors'),
    upsert: createMockUpsert('instructors')
  },
  studio: {
    findMany: createMockFindMany('studios'),
    findUnique: createMockFindUnique('studios'),
    findFirst: createMockFindFirst('studios'),
    create: createMockCreate('studios'),
    update: createMockUpdate('studios'),
    delete: createMockDelete('studios'),
    upsert: createMockUpsert('studios')
  },
  schedule: {
    findMany: createMockFindMany('schedules'),
    findUnique: createMockFindUnique('schedules'),
    findFirst: createMockFindFirst('schedules'),
    create: createMockCreate('schedules'),
    update: createMockUpdate('schedules'),
    delete: createMockDelete('schedules'),
    upsert: createMockUpsert('schedules')
  },
  reservation: {
    findMany: createMockFindMany('reservations'),
    findUnique: createMockFindUnique('reservations'),
    findFirst: createMockFindFirst('reservations'),
    create: createMockCreate('reservations'),
    update: createMockUpdate('reservations'),
    delete: createMockDelete('reservations'),
    upsert: createMockUpsert('reservations')
  },
  customer: {
    findMany: createMockFindMany('customers'),
    findUnique: createMockFindUnique('customers'),
    findFirst: createMockFindFirst('customers'),
    create: createMockCreate('customers'),
    update: createMockUpdate('customers'),
    delete: createMockDelete('customers'),
    upsert: createMockUpsert('customers')
  },
  notificationLog: {
    findMany: createMockFindMany('notificationLog'),
    findUnique: createMockFindUnique('notificationLog'),
    findFirst: createMockFindFirst('notificationLog'),
    create: createMockCreate('notificationLog'),
    update: createMockUpdate('notificationLog'),
    delete: createMockDelete('notificationLog'),
    upsert: createMockUpsert('notificationLog')
  }
}