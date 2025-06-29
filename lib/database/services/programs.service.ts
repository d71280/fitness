import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Program = Database['public']['Tables']['programs']['Row']
type ProgramInsert = Database['public']['Tables']['programs']['Insert']
type ProgramUpdate = Database['public']['Tables']['programs']['Update']

export class ProgramsService {
  private supabase = createServiceRoleClient()

  async getAll(isActive?: boolean) {
    let query = this.supabase
      .from('programs')
      .select('*')
      .order('id')

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch programs: ${error.message}`)
    }

    return data
  }

  async getById(id: number) {
    const { data, error } = await this.supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch program: ${error.message}`)
    }

    return data
  }

  async create(program: ProgramInsert) {
    const { data, error } = await this.supabase
      .from('programs')
      .insert(program)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create program: ${error.message}`)
    }

    return data
  }

  async update(id: number, program: ProgramUpdate) {
    const { data, error } = await this.supabase
      .from('programs')
      .update(program)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update program: ${error.message}`)
    }

    return data
  }

  async delete(id: number) {
    const { error } = await this.supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete program: ${error.message}`)
    }

    return true
  }
}

export const programsService = new ProgramsService()