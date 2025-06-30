import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']
type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export interface ReservationWithRelations extends Reservation {
  schedule: Database['public']['Tables']['schedules']['Row'] & {
    program: Database['public']['Tables']['programs']['Row']
  }
  customer: Database['public']['Tables']['customers']['Row']
}

export class ReservationsService {
  private supabase = createServiceRoleClient()

  async getAll() {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .order('created_at', { ascending: false })

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
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch reservation: ${error.message}`)
    }

    return data as ReservationWithRelations
  }

  async getByScheduleId(scheduleId: number) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch reservations by schedule: ${error.message}`)
    }

    return data as ReservationWithRelations[]
  }

  async getByCustomerId(customerId: number) {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch reservations by customer: ${error.message}`)
    }

    return data as ReservationWithRelations[]
  }

  async create(reservation: ReservationInsert) {
    const { data, error } = await this.supabase
      .from('reservations')
      .insert(reservation)
      .select(`
        *,
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
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
        schedule:schedules(*,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update reservation: ${error.message}`)
    }

    return data as ReservationWithRelations
  }

  async delete(id: number) {
    const { error } = await this.supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete reservation: ${error.message}`)
    }

    return true
  }

  async cancel(id: number) {
    return this.update(id, { status: 'cancelled' })
  }

  async confirm(id: number) {
    return this.update(id, { status: 'confirmed' })
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