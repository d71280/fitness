import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Instructor = Database['public']['Tables']['instructors']['Row']
type InstructorInsert = Database['public']['Tables']['instructors']['Insert']
type InstructorUpdate = Database['public']['Tables']['instructors']['Update']

export class InstructorsService {
  private supabase = createServiceRoleClient()

  async getAll(isActive?: boolean) {
    let query = this.supabase
      .from('instructors')
      .select('*')
      .order('id')

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch instructors: ${error.message}`)
    }

    return data
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from('instructors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch instructor: ${error.message}`)
    }

    return data
  }

  async create(instructor: InstructorInsert) {
    const { data, error } = await this.supabase
      .from('instructors')
      .insert(instructor)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create instructor: ${error.message}`)
    }

    return data
  }

  async update(id: number, instructor: InstructorUpdate) {
    const { data, error } = await this.supabase
      .from('instructors')
      .update(instructor)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update instructor: ${error.message}`)
    }

    return data
  }

  async delete(id: number) {
    const { error } = await this.supabase
      .from('instructors')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete instructor: ${error.message}`)
    }

    return true
  }
}

export const instructorsService = new InstructorsService()