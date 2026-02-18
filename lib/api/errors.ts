/**
 * Custom Error Classes
 * Errores comunes del sistema con códigos específicos
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'User not authenticated', status: number = 401) {
    super(message, status, 'AUTH_ERROR')
    this.name = 'AuthError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'User not authorized', status: number = 403) {
    super(message, status, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation failed',
    public errors?: Record<string, string>
  ) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', status: number = 500) {
    super(message, status, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class InvalidRequestError extends ApiError {
  constructor(message: string = 'Invalid request') {
    super(message, 400, 'INVALID_REQUEST')
    this.name = 'InvalidRequestError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(
    service: string = 'External service',
    message: string = 'Service unavailable'
  ) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}

// ============================================================================
// Error Handler Utilities
// ============================================================================

/**
 * Formatear error para respuesta HTTP
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    }
  }

  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    },
  }
}

/**
 * Determinar status HTTP del error
 */
export function getErrorStatus(error: unknown): number {
  if (error instanceof ApiError) {
    return error.status
  }

  if (error instanceof Error) {
    if (error.message.includes('not found')) return 404
    if (error.message.includes('unauthorized')) return 401
    if (error.message.includes('forbidden')) return 403
  }

  return 500
}

/**
 * Log de error con contexto
 */
export function logError(error: unknown, context: string) {
  const timestamp = new Date().toISOString()

  if (error instanceof ApiError) {
    console.error(`[${timestamp}] [${context}] ${error.code}: ${error.message}`)
  } else if (error instanceof Error) {
    console.error(`[${timestamp}] [${context}] ERROR: ${error.message}`)
    console.error(error.stack)
  } else {
    console.error(`[${timestamp}] [${context}] UNKNOWN ERROR:`, error)
  }
}

/**
 * Wrapper para funciones async que captan errores
 */
export function handleAsyncError(fn: Function, context: string) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, context)
      throw error
    }
  }
}
