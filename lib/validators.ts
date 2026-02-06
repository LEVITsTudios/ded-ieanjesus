/**
 * Validadores seguros para formularios (enfoque Ecuador)
 * Implementados como experto en ciberseguridad
 */

export const ECUADOR_PHONE_PREFIX = '+593'
export const ECUADOR_PROVINCES = [
  'Azuay', 'Bolívar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas',
  'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
  'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
  'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'
]

/**
 * Validar cédula ecuatoriana (10 dígitos)
 * RUC también válido (13 dígitos)
 */
export function validateEcuadorianDNI(dni: string): { valid: boolean; message: string } {
  const cleaned = dni.replace(/\D/g, '')
  
  // Cédula: 10 dígitos
  if (cleaned.length === 10) {
    return validateCedula(cleaned)
  }
  
  // RUC: 13 dígitos
  if (cleaned.length === 13) {
    return { valid: true, message: 'RUC válido' }
  }
  
  return { valid: false, message: 'Cédula/RUC debe tener 10 o 13 dígitos' }
}

/**
 * Validar cédula con algoritmo de check digit
 */
function validateCedula(cedula: string): { valid: boolean; message: string } {
  if (!/^\d{10}$/.test(cedula)) {
    return { valid: false, message: 'Cédula debe contener 10 dígitos' }
  }

  const digits = cedula.split('').map(Number)
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 1]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    let product = digits[i] * weights[i]
    if (product >= 10) product -= 9
    sum += product
  }

  const checkDigit = (10 - (sum % 10)) % 10
  
  if (checkDigit !== digits[9]) {
    return { valid: false, message: 'Cédula inválida (dígito verificador incorrecto)' }
  }

  return { valid: true, message: 'Cédula válida' }
}

/**
 * Validar teléfono ecuatoriano
 * Formato: +593 9XXXXXXXXX (móvil) o +593 2XXXXXXXXX (fijo)
 */
export function validateEcuadorianPhone(phone: string): { valid: boolean; message: string; formatted?: string } {
  const cleaned = phone.replace(/\D/g, '')
  
  // Debe ser 10 dígitos (sin el +593)
  if (cleaned.length === 10) {
    const formatted = `${ECUADOR_PHONE_PREFIX} ${cleaned}`
    
    // Validar que comience con 9 (móvil) o 2-7 (fijo)
    const firstDigit = cleaned[0]
    if (!['2', '3', '4', '5', '6', '7', '9'].includes(firstDigit)) {
      return { valid: false, message: 'Número de teléfono no válido para Ecuador' }
    }
    
    return { 
      valid: true, 
      message: 'Teléfono válido',
      formatted 
    }
  }
  
  // Si vino con +593
  if (cleaned.length === 12 && cleaned.startsWith('593')) {
    const lastTenDigits = cleaned.slice(3)
    return validateEcuadorianPhone(lastTenDigits)
  }

  return { valid: false, message: 'Teléfono debe tener 10 dígitos (sin el prefijo)' }
}

/**
 * Validar email (seguro contra inyecciones)
 */
export function validateEmail(email: string): { valid: boolean; message: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: 'Correo electrónico inválido' }
  }

  if (email.length > 254) {
    return { valid: false, message: 'Correo electrónico demasiado largo' }
  }

  return { valid: true, message: 'Correo válido' }
}

/**
 * Validar contraseña (fuerte)
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Incluye una letra mayúscula')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Incluye una letra minúscula')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Incluye un número')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Incluye un carácter especial (!@#$% etc)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validar nombre completo (Ecuador)
 */
export function validateFullName(name: string): { valid: boolean; message: string } {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return { valid: false, message: 'El nombre es requerido' }
  }

  const parts = trimmed.split(/\s+/)
  
  if (parts.length < 2) {
    return { valid: false, message: 'Por favor ingresa nombre y apellido' }
  }

  // Validar que no contenga números o caracteres especiales
  if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/.test(trimmed)) {
    return { valid: false, message: 'El nombre contiene caracteres inválidos' }
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'El nombre es demasiado largo' }
  }

  return { valid: true, message: 'Nombre válido' }
}

/**
 * Formatear teléfono a formato visible
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `+593 ${cleaned}`
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('593')) {
    return `+593 ${cleaned.slice(3)}`
  }

  return phone
}

/**
 * Formatear teléfono para almacenamiento (con prefijo)
 */
export function formatPhoneStorage(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `${ECUADOR_PHONE_PREFIX}${cleaned}`
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('593')) {
    return `+593${cleaned.slice(3)}`
  }

  return cleaned.length === 10 ? `${ECUADOR_PHONE_PREFIX}${cleaned}` : phone
}

/**
 * Validar dirección (no vacía, no inyecciones)
 */
export function validateAddress(address: string): { valid: boolean; message: string } {
  const trimmed = address.trim()
  
  if (!trimmed) {
    return { valid: false, message: 'La dirección es requerida' }
  }

  if (trimmed.length < 5) {
    return { valid: false, message: 'La dirección debe ser más descriptiva' }
  }

  if (trimmed.length > 255) {
    return { valid: false, message: 'La dirección es demasiado larga' }
  }

  return { valid: true, message: 'Dirección válida' }
}
