import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']
type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export interface ReservationWithRelations extends Reservation {
  customer: Customer
  schedule: Database['public']['Tables']['schedules']['Row'] & {
    program: Database['public']['Tables']['programs']['Row']
    instructor: Database['public']['Tables']['instructors']['Row']
    studio: Database['public']['Tables']['studios']['Row']
  }
}

export class ReservationsService {
  private supabase = createServiceRoleClient()

  async getAll(filters?: { status?: string; customerId?: number; scheduleId?: number }) {
    let query = this.supabase
      .from('reservations')
      .select(`
        *,
        customer:customers(*),
        schedule:schedules(
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.scheduleId) {
      query = query.eq('schedule_id', filters.scheduleId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch reservations: ${error.message}`)
    }

    return data as ReservationWithRelations[]
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        customer:customers(*),
        schedule:schedules(
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch reservation: ${error.message}`)
    }

    return data as ReservationWithRelations
  }

  async create(reservation: ReservationInsert, customer?: CustomerInsert) {
    // トランザクション処理
    const { data: customerData, error: customerError } = customer
      ? await this.upsertCustomer(customer)
      : { data: null, error: null }

    if (customerError) {
      throw new Error(`Failed to upsert customer: ${customerError.message}`)
    }

    const reservationData = {
      ...reservation,
      customer_id: customerData?.id || reservation.customer_id
    }

    const { data, error } = await this.supabase
      .from('reservations')
      .insert(reservationData)
      .select(`
        *,
        customer:customers(*),
        schedule:schedules(
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create reservation: ${error.message}`)
    }

    return data as ReservationWithRelations
  }

  async update(id: number, reservation: ReservationUpdate) {
    const { data, error } = await this.supabase
      .from('reservations')
      .update(reservation)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        schedule:schedules(
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update reservation: ${error.message}`)
    }

    return data as ReservationWithRelations
  }

  async cancel(id: number, reason?: string) {
    const update: ReservationUpdate = {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    }

    return this.update(id, update)
  }

  async checkDuplicate(scheduleId: number, customerId: number) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('id')
      .eq('schedule_id', scheduleId)
      .eq('customer_id', customerId)
      .eq('status', 'confirmed')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check duplicate reservation: ${error.message}`)
    }

    return !!data
  }

  async getReservationCount(scheduleId: number) {
    const { count, error } = await this.supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('schedule_id', scheduleId)
      .eq('status', 'confirmed')

    if (error) {
      throw new Error(`Failed to get reservation count: ${error.message}`)
    }

    return count || 0
  }

  private async upsertCustomer(customer: CustomerInsert) {
    if (customer.line_id) {
      // LINE IDがある場合はupsert
      const { data, error } = await this.supabase
        .from('customers')
        .upsert(customer, { onConflict: 'line_id' })
        .select()
        .single()

      return { data, error }
    } else {
      // LINE IDがない場合は新規作成
      const { data, error } = await this.supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()

      return { data, error }
    }
  }
}

export const reservationsService = new ReservationsService()