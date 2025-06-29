import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Studio = Database['public']['Tables']['studios']['Row']
type StudioInsert = Database['public']['Tables']['studios']['Insert']
type StudioUpdate = Database['public']['Tables']['studios']['Update']

export class StudiosService {
  private supabase = createServiceRoleClient()

  async getAll(isActive?: boolean) {
    let query = this.supabase
      .from('studios')
      .select('*')
      .order('id')

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch studios: ${error.message}`)
    }

    return data
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from('studios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch studio: ${error.message}`)
    }

    return data
  }

  async create(studio: StudioInsert) {
    const { data, error } = await this.supabase
      .from('studios')
      .insert(studio)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create studio: ${error.message}`)
    }

    return data
  }

  async update(id: number, studio: StudioUpdate) {
    const { data, error } = await this.supabase
      .from('studios')
      .update(studio)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update studio: ${error.message}`)
    }

    return data
  }

  async delete(id: number) {
    const { error } = await this.supabase
      .from('studios')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete studio: ${error.message}`)
    }

    return true
  }
}

export const studiosService = new StudiosService()