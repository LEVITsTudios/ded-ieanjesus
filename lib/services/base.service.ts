/**
 * Servicio Base para CRUD Operations
 * Proporciona funcionalidades comunes reutilizables
 * 
 * Uso:
 * const userService = new BaseService('profiles')
 * const users = await userService.list()
 * const user = await userService.getById(id)
 */

import { createClient } from '@/lib/supabase/server'
import { AuthError, DatabaseError } from '@/lib/api/errors'
import { z } from 'zod'
import { log_audit } from './audit.service'

interface ListOptions {
  search?: string
  searchField?: string
  filters?: Record<string, any>
  orderBy?: string
  ascending?: boolean
  limit?: number
  offset?: number
  institutionId?: string
}

interface CreateOptions {
  institutionId?: string
  userId?: string
  auditLog?: boolean
}

interface UpdateOptions {
  institutionId?: string
  userId?: string
  auditLog?: boolean
}

interface DeleteOptions {
  institutionId?: string
  userId?: string
  auditLog?: boolean
}

export class BaseService {
  protected tableName: string
  protected institution_required = true

  constructor(tableName: string, institution_required = true) {
    this.tableName = tableName
    this.institution_required = institution_required
  }

  /**
   * Obtener cliente Supabase autenticado
   */
  protected async getAuthenticatedClient() {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthError('User not authenticated', 401, 'AUTH_REQUIRED')
    }

    return { supabase, user }
  }

  /**
   * Obtener perfil del usuario actual
   */
  protected async getCurrentProfile() {
    const { supabase, user } = await this.getAuthenticatedClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      throw new DatabaseError('Could not fetch user profile', 500, 'PROFILE_NOT_FOUND')
    }

    return data
  }

  /**
   * Construir query base con filtros
   */
  protected async buildQuery(options: ListOptions) {
    const { supabase } = await this.getAuthenticatedClient()

    let query = supabase.from(this.tableName).select('*')

    // Filtrar por institución si es requerido
    if (this.institution_required && options.institutionId) {
      query = query.eq('institution_id', options.institutionId)
    }

    // Aplicar filtros adicionales
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      }
    }

    // Búsqueda
    if (options.search && options.searchField) {
      query = query.ilike(options.searchField, `%${options.search}%`)
    }

    // Ordenamiento
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Paginación
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  /**
   * GET - Listar registros
   */
  async list(options: ListOptions = {}) {
    try {
      // Si no proporciona institutionId pero es requerido, obtener del usuario
      if (this.institution_required && !options.institutionId) {
        const profile = await this.getCurrentProfile()
        options.institutionId = profile.institution_id
      }

      const query = await this.buildQuery(options)
      const { data, error } = await query

      if (error) {
        throw error
      }

      return { success: true, data, count: data?.length ?? 0 }
    } catch (error) {
      return this.handleError(error, 'list')
    }
  }

  /**
   * GET - Obtener por ID
   */
  async getById(id: string, institutionId?: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      if (!institutionId && this.institution_required) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      let query = supabase.from(this.tableName).select('*').eq('id', id)

      if (this.institution_required && institutionId) {
        query = query.eq('institution_id', institutionId)
      }

      const { data, error } = await query.single()

      if (error) {
        throw new DatabaseError('Record not found', 404, 'NOT_FOUND')
      }

      return { success: true, data }
    } catch (error) {
      return this.handleError(error, 'getById')
    }
  }

  /**
   * POST - Crear registro
   */
  async create(payload: any, options: CreateOptions = {}) {
    try {
      const { supabase, user } = await this.getAuthenticatedClient()

      // Asegurar que tiene institution_id si es requerido
      if (this.institution_required && !payload.institution_id) {
        const profile = await this.getCurrentProfile()
        payload.institution_id = profile.institution_id
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([payload])
        .select()
        .single()

      if (error) {
        throw new DatabaseError(error.message, 400, 'CREATE_FAILED')
      }

      // Log auditoría si está habilitado
      if (options.auditLog !== false) {
        await log_audit({
          action: 'INSERT',
          table_name: this.tableName,
          record_id: data.id,
          institution_id: payload.institution_id,
          new_values: data,
        })
      }

      return { success: true, data }
    } catch (error) {
      return this.handleError(error, 'create')
    }
  }

  /**
   * PUT - Actualizar registro
   */
  async update(id: string, payload: any, options: UpdateOptions = {}) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      // Obtener registros anterior para auditoría
      let institutionId = options.institutionId
      if (!institutionId && this.institution_required) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      let getOldQuery = supabase.from(this.tableName).select('*').eq('id', id)
      if (this.institution_required && institutionId) {
        getOldQuery = getOldQuery.eq('institution_id', institutionId)
      }

      const { data: oldData, error: getError } = await getOldQuery.single()

      if (getError || !oldData) {
        throw new DatabaseError('Record to update not found', 404, 'NOT_FOUND')
      }

      // Actualizar
      let updateQuery = supabase
        .from(this.tableName)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (this.institution_required && institutionId) {
        updateQuery = updateQuery.eq('institution_id', institutionId)
      }

      const { data: newData, error: updateError } = await updateQuery.select().single()

      if (updateError) {
        throw new DatabaseError(updateError.message, 400, 'UPDATE_FAILED')
      }

      // Log auditoría
      if (options.auditLog !== false) {
        await log_audit({
          action: 'UPDATE',
          table_name: this.tableName,
          record_id: id,
          institution_id: institutionId,
          old_values: oldData,
          new_values: newData,
        })
      }

      return { success: true, data: newData }
    } catch (error) {
      return this.handleError(error, 'update')
    }
  }

  /**
   * DELETE - Eliminar registro
   */
  async delete(id: string, options: DeleteOptions = {}) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      let institutionId = options.institutionId
      if (!institutionId && this.institution_required) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      // Obtener datos antes de eliminar (para auditoría)
      let getQuery = supabase.from(this.tableName).select('*').eq('id', id)
      if (this.institution_required && institutionId) {
        getQuery = getQuery.eq('institution_id', institutionId)
      }

      const { data: deletedData, error: getError } = await getQuery.single()

      if (getError || !deletedData) {
        throw new DatabaseError('Record to delete not found', 404, 'NOT_FOUND')
      }

      // Eliminar
      let deleteQuery = supabase.from(this.tableName).delete().eq('id', id)
      if (this.institution_required && institutionId) {
        deleteQuery = deleteQuery.eq('institution_id', institutionId)
      }

      const { error: deleteError } = await deleteQuery

      if (deleteError) {
        throw new DatabaseError(deleteError.message, 400, 'DELETE_FAILED')
      }

      // Log auditoría
      if (options.auditLog !== false) {
        await log_audit({
          action: 'DELETE',
          table_name: this.tableName,
          record_id: id,
          institution_id: institutionId,
          old_values: deletedData,
        })
      }

      return { success: true, message: 'Record deleted successfully' }
    } catch (error) {
      return this.handleError(error, 'delete')
    }
  }

  /**
   * Búsqueda global
   */
  async search(query: string, searchFields: string[], institutionId?: string, limit = 10) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      if (!institutionId && this.institution_required) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      // Construir WHERE con OR para múltiples campos
      let dbQuery = supabase.from(this.tableName).select('*')

      if (this.institution_required && institutionId) {
        dbQuery = dbQuery.eq('institution_id', institutionId)
      }

      // Supabase no soporta OR nativo, hacer múltiples queries
      const results = await Promise.all(
        searchFields.map((field) =>
          supabase
            .from(this.tableName)
            .select('*')
            .ilike(field, `%${query}%`)
            .limit(limit)
            .then((res) => res.data || [])
        )
      )

      // Combinar y deduplicar
      const combined = results.flat()
      const deduped = Array.from(new Map(combined.map((item) => [item.id, item])).values())

      return { success: true, data: deduped.slice(0, limit) }
    } catch (error) {
      return this.handleError(error, 'search')
    }
  }

  /**
   * Contador de registros
   */
  async count(filters?: Record<string, any>, institutionId?: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      if (!institutionId && this.institution_required) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true })

      if (this.institution_required && institutionId) {
        query = query.eq('institution_id', institutionId)
      }

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined) {
            query = query.eq(key, value)
          }
        }
      }

      const { count, error } = await query

      if (error) {
        throw error
      }

      return { success: true, count: count ?? 0 }
    } catch (error) {
      return this.handleError(error, 'count')
    }
  }

  /**
   * Validar entrada con Zod schema
   */
  protected async validateInput(schema: z.ZodSchema, data: any) {
    try {
      const validated = schema.parse(data)
      return { valid: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        }
      }
      return { valid: false, errors: [{ message: 'Validation failed' }] }
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any, operation: string) {
    console.error(`[${this.tableName}.${operation}]`, error)

    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        status: error.status,
      }
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        status: error.status,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      status: 500,
    }
  }
}

export default BaseService
