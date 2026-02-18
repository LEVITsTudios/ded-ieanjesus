/**
 * Servicio de Auditoría
 * Centraliza el logging de todas las acciones del sistema
 * 
 * Uso:
 * await log_audit({
 *   action: 'UPDATE',
 *   table_name: 'courses',
 *   record_id: courseId,
 *   old_values: { name: 'Old Name' },
 *   new_values: { name: 'New Name' }
 * })
 */

import { createClient } from '@/lib/supabase/server'

export interface AuditLogInput {
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'CONFIG'
  table_name?: string
  record_id?: string
  institution_id?: string
  user_id?: string
  old_values?: any
  new_values?: any
  status?: 'SUCCESS' | 'FAILED' | 'PARTIAL'
  error_message?: string
  duration_ms?: number
  ip_address?: string
}

/**
 * Registrar acción de auditoría
 */
export async function log_audit(input: AuditLogInput) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      action,
      table_name,
      record_id,
      institution_id,
      old_values,
      new_values,
      status = 'SUCCESS',
      error_message,
      duration_ms,
      ip_address,
    } = input

    // Calcular cambios
    const changes = calculateChanges(old_values, new_values)

    const { data, error } = await supabase.from('audit_logs').insert({
      action,
      table_name,
      record_id,
      institution_id,
      user_id: user?.id,
      user_email: user?.email,
      old_values: old_values || null,
      new_values: new_values || null,
      changes,
      status,
      error_message,
      duration_ms,
      ip_address,
      executed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Audit log failed:', error)
      // No lanzar error para no romper operaciones principales
    }

    return data
  } catch (error) {
    console.error('Audit log exception:', error)
    // Silenciosamente fallar, no romper la operación principal
  }
}

/**
 * Registrar sesión de usuario
 */
export async function log_user_session(action: 'LOGIN' | 'LOGOUT', metadata?: Record<string, any>) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    await log_audit({
      action,
      institution_id: profile?.institution_id,
      user_id: user.id,
      status: 'SUCCESS',
    })
  } catch (error) {
    console.error('Session log failed:', error)
  }
}

/**
 * Registrar exportación de datos
 */
export async function log_data_export(
  table_name: string,
  format: string,
  record_count: number,
  institution_id?: string
) {
  try {
    await log_audit({
      action: 'EXPORT',
      table_name,
      institution_id,
      status: 'SUCCESS',
      new_values: {
        format,
        record_count,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Export log failed:', error)
  }
}

/**
 * Registrar importación de datos
 */
export async function log_data_import(
  table_name: string,
  format: string,
  record_count: number,
  institution_id?: string
) {
  try {
    await log_audit({
      action: 'IMPORT',
      table_name,
      institution_id,
      status: 'SUCCESS',
      new_values: {
        format,
        record_count,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Import log failed:', error)
  }
}

/**
 * Registrar cambio de configuración
 */
export async function log_config_change(
  config_key: string,
  old_value: any,
  new_value: any,
  institution_id?: string
) {
  try {
    await log_audit({
      action: 'CONFIG',
      institution_id,
      status: 'SUCCESS',
      old_values: { [config_key]: old_value },
      new_values: { [config_key]: new_value },
    })
  } catch (error) {
    console.error('Config log failed:', error)
  }
}

/**
 * Obtener actividad reciente de un usuario
 */
export async function getUserActivity(userId: string, limit = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get user activity failed:', error)
    return { success: false, data: [] }
  }
}

/**
 * Obtener cambios en una institución
 */
export async function getInstitutionChanges(institutionId: string, limit = 50) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get institution changes failed:', error)
    return { success: false, data: [] }
  }
}

/**
 * Obtener fallos del sistema
 */
export async function getSystemFailures(limit = 50, hoursSince = 24) {
  try {
    const supabase = await createClient()
    const sinceDate = new Date(Date.now() - hoursSince * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('status', 'FAILED')
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get system failures failed:', error)
    return { success: false, data: [] }
  }
}

/**
 * Limpiar logs antiguos (ejecutar periódicamente)
 */
export async function cleanupOldAuditLogs(daysBefore = 365) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('cleanup_old_audit_logs', {
      p_days: daysBefore,
    })

    if (error) throw error

    return { success: true, deleted: data }
  } catch (error) {
    console.error('Cleanup failed:', error)
    return { success: false, deleted: 0 }
  }
}

/**
 * Calcular cambios entre valores antiguo y nuevo
 */
function calculateChanges(oldValues?: any, newValues?: any): any {
  if (!oldValues || !newValues) return null

  const changes: any = {}

  // Comparar valores nuevos
  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changes[key] = {
        old: oldValues[key],
        new: newValues[key],
      }
    }
  }

  // Buscar campos eliminados
  for (const key in oldValues) {
    if (!(key in newValues)) {
      changes[key] = {
        old: oldValues[key],
        new: null,
      }
    }
  }

  return Object.keys(changes).length > 0 ? changes : null
}

// Exportar funciones como servicio
export const auditService = {
  log: log_audit,
  logSession: log_user_session,
  logExport: log_data_export,
  logImport: log_data_import,
  logConfig: log_config_change,
  getUserActivity,
  getInstitutionChanges,
  getSystemFailures,
  cleanup: cleanupOldAuditLogs,
}

export default auditService
