/**
 * Servicios Específicos por Dominio
 * Heredan de BaseService y agregan lógica especializada
 */

import { BaseService } from './base.service'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// PROFILE SERVICE - Gestión de Usuarios
// ============================================================================

export const ProfileSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'student', 'parent']),
  institution_id: z.string().uuid().optional(),
})

export class ProfileService extends BaseService {
  constructor() {
    super('profiles')
  }

  /**
   * Obtener perfil completo con extensiones por rol
   */
  async getCompleteProfile(userId: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      // Obtener perfil base
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        return { success: false, error: 'Profile not found' }
      }

      // Obtener extensión según rol
      let roleProfile = null
      if (profile.role === 'teacher') {
        const { data } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        roleProfile = data
      } else if (profile.role === 'parent') {
        const { data } = await supabase
          .from('parent_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        roleProfile = data
      } else if (profile.role === 'admin') {
        const { data } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        roleProfile = data
      }

      return {
        success: true,
        data: { ...profile, roleProfile },
      }
    } catch (error) {
      return this.handleError(error, 'getCompleteProfile')
    }
  }

  /**
   * Buscar usuario por DNI
   */
  async findByDni(dni: string, institutionId?: string) {
    try {
      const { supabase, user } = await this.getAuthenticatedClient()

      if (!institutionId) {
        const profile = await this.getCurrentProfile()
        institutionId = profile.institution_id
      }

      const query = supabase
        .from('profiles')
        .select('*')
        .eq('dni', dni)
        .eq('institution_id', institutionId)

      const { data, error } = await query.single()

      if (error) {
        return { success: false, error: 'User not found' }
      }

      return { success: true, data }
    } catch (error) {
      return this.handleError(error, 'findByDni')
    }
  }

  /**
   * Obtener maestros de una institución
   */
  async getTeachers(institutionId: string) {
    const result = await this.list({
      filters: { role: 'teacher', institution_id: institutionId },
      limit: 100,
    })

    return result
  }

  /**
   * Obtener estudiantes de una institución
   */
  async getStudents(institutionId: string) {
    const result = await this.list({
      filters: { role: 'student', institution_id: institutionId },
      limit: 500,
    })

    return result
  }

  /**
   * Obtener administradores de una institución
   */
  async getAdmins(institutionId: string) {
    const result = await this.list({
      filters: { role: 'admin', institution_id: institutionId },
      limit: 50,
    })

    return result
  }

  private handleError(error: any, operation: string) {
    console.error(`[ProfileService.${operation}]`, error)
    return {
      success: false,
      error: error.message || 'Operation failed',
    }
  }
}

// ============================================================================
// COURSE SERVICE - Gestión de Cursos
// ============================================================================

export const CourseSchema = z.object({
  name: z.string().min(2, 'Nombre del curso requerido'),
  code: z.string().min(2, 'Código del curso requerido'),
  teacher_id: z.string().uuid('Maestro inválido'),
  description: z.string().optional(),
  grade_level: z.string().optional(),
  subject: z.string().optional(),
  max_students: z.number().int().min(1).default(30),
  institution_id: z.string().uuid().optional(),
})

export class CourseService extends BaseService {
  constructor() {
    super('courses')
  }

  /**
   * Obtener curso con maestro y estudiantes
   */
  async getCourseWithDetails(courseId: string, institutionId?: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(
          `
          *,
          teacher:teacher_id (
            id, email, full_name, avatar_url
          )
        `
        )
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return { success: false, error: 'Course not found' }
      }

      // Obtener estudiantes inscritos
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(
          `
          *,
          student:student_id (
            id, email, full_name, avatar_url
          )
        `
        )
        .eq('course_id', courseId)
        .eq('status', 'active')

      if (!enrollError) {
        course.students = enrollments || []
        course.student_count = enrollments?.length || 0
      }

      return { success: true, data: course }
    } catch (error) {
      return this.handleError(error, 'getCourseWithDetails')
    }
  }

  /**
   * Obtener cursos de un maestro
   */
  async getTeacherCourses(teacherId: string, institutionId?: string) {
    const result = await this.list({
      filters: {
        teacher_id: teacherId,
        institution_id: institutionId,
      },
      orderBy: 'name',
    })

    return result
  }

  /**
   * Obtener cursos con disponibilidad
   */
  async getCoursesWithAvailability(institutionId: string) {
    try {
      const { data: courses, success } = await this.list({
        filters: { institution_id: institutionId, status: 'active' },
      })

      if (!success || !courses) return { success: false, data: [] }

      // Agregar información de disponibilidad
      const { supabase } = await this.getAuthenticatedClient()

      const withAvailability = await Promise.all(
        courses.map(async (course) => {
          const { count } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact' })
            .eq('course_id', course.id)
            .eq('status', 'active')

          return {
            ...course,
            enrolled_count: count || 0,
            available_slots: Math.max(0, course.max_students - (count || 0)),
            is_full: (count || 0) >= course.max_students,
          }
        })
      )

      return { success: true, data: withAvailability }
    } catch (error) {
      return this.handleError(error, 'getCoursesWithAvailability')
    }
  }

  private handleError(error: any, operation: string) {
    console.error(`[CourseService.${operation}]`, error)
    return {
      success: false,
      error: error.message || 'Operation failed',
    }
  }
}

// ============================================================================
// GRADE SERVICE - Gestión de Calificaciones
// ============================================================================

export const GradeSchema = z.object({
  student_id: z.string().uuid(),
  course_id: z.string().uuid(),
  period: z.string(),
  grade: z.number().min(0).max(100),
  comments: z.string().optional(),
})

export class GradeService extends BaseService {
  constructor() {
    super('grades')
  }

  /**
   * Obtener calificaciones de un estudiante en un curso
   */
  async getStudentCourseGrades(studentId: string, courseId: string) {
    const result = await this.list({
      filters: {
        student_id: studentId,
        course_id: courseId,
      },
      orderBy: 'period',
    })

    return result
  }

  /**
   * Obtener promedio de calificaciones de un estudiante
   */
  async getStudentAverage(studentId: string, courseId?: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      let query = supabase
        .from('grades')
        .select('grade')
        .eq('student_id', studentId)

      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        return { success: false, average: 0 }
      }

      const average = data.reduce((sum, g) => sum + (g.grade || 0), 0) / data.length

      return {
        success: true,
        average: Math.round(average * 100) / 100,
        count: data.length,
      }
    } catch (error) {
      return this.handleError(error, 'getStudentAverage')
    }
  }

  /**
   * Obtener estadísticas de calificaciones de un curso
   */
  async getCourseGradeStats(courseId: string) {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      const { data, error } = await supabase
        .from('grades')
        .select('grade')
        .eq('course_id', courseId)

      if (error || !data || data.length === 0) {
        return {
          success: false,
          stats: {
            avg: 0,
            min: 0,
            max: 0,
            count: 0,
          },
        }
      }

      const grades = data.map((g) => g.grade || 0)
      const avg =  grades.reduce((a, b) => a + b, 0) / grades.length
      const min = Math.min(...grades)
      const max = Math.max(...grades)

      return {
        success: true,
        stats: {
          avg: Math.round(avg * 100) / 100,
          min,
          max,
          count: grades.length,
          median: this.getMedian(grades),
        },
      }
    } catch (error) {
      return this.handleError(error, 'getCourseGradeStats')
    }
  }

  private getMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  private handleError(error: any, operation: string) {
    console.error(`[GradeService.${operation}]`, error)
    return {
      success: false,
      error: error.message || 'Operation failed',
    }
  }
}

// ============================================================================
// ENROLLMENT SERVICE - Gestión de Inscripciones
// ============================================================================

export class EnrollmentService extends BaseService {
  constructor() {
    super('enrollments')
  }

  /**
   * Obtener inscripciones de un estudiante
   */
  async getStudentEnrollments(studentId: string) {
    const result = await this.list({
      filters: { student_id: studentId, status: 'active' },
    })

    return result
  }

  /**
   * Obtener inscripciones de un curso
   */
  async getCourseEnrollments(courseId: string) {
    const result = await this.list({
      filters: { course_id: courseId, status: 'active' },
      limit: 100,
    })

    return result
  }
}

// ============================================================================
// ATTENDANCE SERVICE - Gestión de Asistencia
// ============================================================================

export class AttendanceService extends BaseService {
  constructor() {
    super('attendances')
  }

  /**
   * Obtener porcentaje de asistencia de un estudiante
   */
  async getStudentAttendancePercentage(studentId: string, courseId?: string): Promise<any> {
    try {
      const { supabase } = await this.getAuthenticatedClient()

      let query = supabase
        .from('attendances')
        .select('status')
        .eq('student_id', studentId)

      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        return { success: false, percentage: 0, total: 0 }
      }

      const present = data.filter((a) => a.status === 'present').length
      const percentage = (present / data.length) * 100

      return {
        success: true,
        percentage: Math.round(percentage),
        present,
        total: data.length,
      }
    } catch (error) {
      return this.handleError(error, 'getStudentAttendancePercentage')
    }
  }

  private handleError(error: any, operation: string) {
    console.error(`[AttendanceService.${operation}]`, error)
    return {
      success: false,
      error: error.message || 'Operation failed',
    }
  }
}

// ============================================================================
// Exportar todas las instancias de servicios
// ============================================================================

export const profileService = new ProfileService()
export const courseService = new CourseService()
export const gradeService = new GradeService()
export const enrollmentService = new EnrollmentService()
export const attendanceService = new AttendanceService()
