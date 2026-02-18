/**
 * Validadores seguros para formularios (enfoque Ecuador)
 * Implementados como experto en ciberseguridad
 */

export const ECUADOR_PHONE_PREFIX = '+593'
export const ECUADOR_COUNTRY_CODE = '+593'
export const ECUADOR_AREA_CODES: { [key: string]: string } = {
  '2': 'Pichincha/Tungurahua',
  '3': 'Chimborazo/Cotopaxi',
  '4': 'Manabí/Santo Domingo',
  '5': 'Guayas/Santa Elena',
  '6': 'El Oro/Azuay',
  '7': 'Loja/Zamora/Morona Santiago',
  '8': 'Sucumbíos/Imbabura/Carchi',
  '9': 'Esmeraldas',
}

export const ECUADOR_PROVINCES = [
  'Azuay', 'Bolívar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas',
  'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
  'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
  'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'
]

/**
 * Validar cédula ecuatoriana (10 dígitos)
 * RUC también válido (13 dígitos)
 * El primer dígito identifica la provincia (01-24)
 */
export function validateEcuadorianDNI(dni: string): { valid: boolean; message: string } {
  const cleaned = dni.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return validateCedula(cleaned)
  }
  
if (cleaned.length === 13) {
  if (!validateCedula(cleaned.substring(0, 10)).valid) {
    return { valid: false, message: 'RUC inválido (cédula base incorrecta)' }
  }

  if (cleaned.slice(-3) !== '001') {
    return { valid: false, message: 'RUC debe terminar en 001' }
  }

  return { valid: true, message: 'RUC válido' }
}

  
  return { valid: false, message: 'Cédula debe tener 10 dígitos o RUC 13 dígitos' }
}

/**
 * Validar cédula ecuatoriana (10 dígitos)
 * Solo verifica:
 * - Exactamente 10 dígitos
 * - Código de provincia válido (01-24)
 * 
 * No se valida el dígito verificador para permitir flexibilidad
 */
function validateCedula(cedula: string): { valid: boolean; message: string } {
  if (!/^\d{10}$/.test(cedula)) {
    return { valid: false, message: 'Cédula debe contener exactamente 10 dígitos' }
  }

  const provinceCode = parseInt(cedula.substring(0, 2))
  if (provinceCode < 1 || provinceCode > 24) {
    return { valid: false, message: `Código de provincia inválido (${provinceCode})` }
  }

  const thirdDigit = parseInt(cedula[2])
  if (thirdDigit > 5) {
    return { valid: false, message: 'Tercer dígito inválido para persona natural' }
  }

  // Validar dígito verificador (módulo 10)
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    let result = parseInt(cedula[i]) * coefficients[i]
    if (result >= 10) result -= 9
    sum += result
  }

  const verifier = (10 - (sum % 10)) % 10
  const lastDigit = parseInt(cedula[9])

  if (verifier !== lastDigit) {
    return { valid: false, message: 'Dígito verificador inválido' }
  }

  return { valid: true, message: 'Cédula válida' }
}


/**
 * Validar y formatear teléfono ecuatoriano
 * Acepta:
 * - Celulares: +593 9XXXXXXXX (9 dígitos después del prefijo)
 * - Fijos: +593 2-7XXXXXXX (7-8 dígitos después del prefijo)
 * - Formatos: 0963881234, 963881234, +593963881234
 */
export function validateEcuadorianPhone(phone: string): { valid: boolean; message: string; formatted?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Teléfono requerido' }
  }

  // Remover espacios, guiones, paréntesis
  let cleaned = phone.trim().replace(/[\s\-()]/g, '')
  
  // Extraer los dígitos sin prefijo
  let withoutPrefix = ''
  
  if (cleaned.startsWith('+593')) {
    withoutPrefix = cleaned.slice(4)
  } else if (cleaned.startsWith('0593')) {
    withoutPrefix = cleaned.slice(4)
  } else if (cleaned.startsWith('593')) {
    withoutPrefix = cleaned.slice(3)
  } else if (cleaned.startsWith('0')) {
    // Si comienza con 0, removerlo (formato local ecuatoriano)
    withoutPrefix = cleaned.slice(1)
  } else {
    withoutPrefix = cleaned
  }

  // Validar que sean todos dígitos
  if (!/^\d+$/.test(withoutPrefix)) {
    return { valid: false, message: 'El teléfono solo debe contener dígitos' }
  }

  // Validar longitud: celular (9 dígitos) o fijo (7-8 dígitos)
  const length = withoutPrefix.length
  const firstDigit = withoutPrefix[0]
  
  let phoneType = ''
  
  // Celulares: comienzan con 9 y tienen 9 dígitos
  if (firstDigit === '9' && length === 9) {
    phoneType = 'celular'
  }
  // Fijos: comienzan con 2-7 y tienen 7-8 dígitos
  else if (['2', '3', '4', '5', '6', '7'].includes(firstDigit) && (length === 7 || length === 8)) {
    phoneType = 'fijo'
  }
  else {
    return { 
      valid: false, 
      message: `Formato inválido: Celular debe tener 9 dígitos (9XXXXXXXX) o Fijo 7-8 dígitos (2-7XXXXXXX)` 
    }
  }

  // Formatear: +593 XXXXXXXXX
  const formatted = `${ECUADOR_PHONE_PREFIX} ${withoutPrefix}`
  
  return {
    valid: true,
    message: `Teléfono válido (${phoneType})`,
    formatted
  }
}

/**
 * Validar fecha de nacimiento
 */
export function validateDateOfBirth(dateStr: string, minAge: number = 5): { valid: boolean; message: string; age?: number } {
  if (!dateStr) {
    return { valid: false, message: 'La fecha de nacimiento es requerida' }
  }

  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    return { valid: false, message: 'Formato de fecha inválido (debe ser AAAA-MM-DD)' }
  }

  const birthDate = new Date(dateStr)
  const today = new Date()

  // Validar que la fecha sea válida
  if (isNaN(birthDate.getTime())) {
    return { valid: false, message: 'La fecha es inválida' }
  }

  // Validar año (debe estar entre 1900 y el año actual)
  const year = birthDate.getFullYear()
  if (year < 1900 || year > today.getFullYear()) {
    return { valid: false, message: 'El año debe estar entre 1900 y ' + today.getFullYear() }
  }

  if (birthDate > today) {
    return { valid: false, message: 'La fecha no puede ser en el futuro' }
  }

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  if (age < minAge) {
    return { valid: false, message: `La edad mínima es ${minAge} años` }
  }

  if (age > 120) {
    return { valid: false, message: 'La edad no es válida' }
  }

  return { valid: true, message: 'Fecha válida', age }
}

/**
 * Validar dirección
 */
export function validateAddress(address: string): { valid: boolean; message: string } {
  const trimmed = address.trim()
  
  if (!trimmed) {
    return { valid: false, message: 'La dirección es requerida' }
  }

  if (trimmed.length < 10) {
    return { valid: false, message: 'La dirección debe ser más descriptiva (mínimo 10 caracteres)' }
  }

  if (trimmed.length > 255) {
    return { valid: false, message: 'La dirección es demasiado larga' }
  }

  return { valid: true, message: 'Dirección válida' }
}

/**
 * Validar nombre completo
 */
export function validateFullName(name: string): { valid: boolean; message: string } {
  const trimmed = name.trim()

  if (trimmed.length < 3) {
    return { valid: false, message: 'El nombre debe tener al menos 3 caracteres' }
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'El nombre no puede exceder 100 caracteres' }
  }

  const words = trimmed.split(/\s+/)
  if (words.length < 2) {
    return { valid: false, message: 'Debes ingresar nombre y apellido' }
  }

  if (/\d/.test(trimmed)) {
    return { valid: false, message: 'El nombre no puede contener números' }
  }

  return { valid: true, message: 'Nombre válido' }
}

/**
 * Validar email
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
 * Formatear teléfono ecuatoriano eliminando espacios y prefijo, dejando solo dígitos
 * Para almacenar en BD o usar en APIs
 */
export function formatEcuadorianPhoneForStorage(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-()]/g, '')
  
  if (cleaned.startsWith('+593')) {
    return cleaned.slice(4) // Quitar +593
  } else if (cleaned.startsWith('0593')) {
    return cleaned.slice(4)
  } else if (cleaned.startsWith('593')) {
    return cleaned.slice(3)
  } else if (cleaned.startsWith('0')) {
    return cleaned.slice(1)
  }
  
  return cleaned
}

/**
 * Dividir nombre en nombre y apellido
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const words = fullName.trim().split(/\s+/)
  if (words.length >= 2) {
    return {
      firstName: words[0],
      lastName: words.slice(1).join(' ')
    }
  }
  return { firstName: fullName, lastName: '' }
}

/**
 * Validar contraseña (fuerte)
 * Requisitos: Mínimo 8 caracteres, mayúsculas, minúsculas, números
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!password || password.length < 8) {
    errors.push('Mínimo 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener letras mayúsculas')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener letras minúsculas')
  }

  if (!/\d/.test(password)) {
    errors.push('Debe contener números')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
