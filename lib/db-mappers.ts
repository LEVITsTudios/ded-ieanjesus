// Centralized mapping functions to normalize frontend values to DB tokens
export function mapGender(g: string | undefined | null) {
  if (!g) return null
  switch (g) {
    case "male":
      return "masculino"
    case "female":
      return "femenino"
    case "other":
      return "otro"
    case "prefer_not_say":
      return "prefiero_no_decir"
    default:
      return null
  }
}

export function mapDocumentType(d: string | undefined | null) {
  if (!d) return null
  switch (d) {
    case "dni":
      return "dni"
    case "passport":
      return "pasaporte"
    case "curp":
      return "otro"
    case "other":
      return "otro"
    case "cedula":
      return "cedula"
    default:
      return null
  }
}

export function mapLearningStyle(s: string | undefined | null) {
  if (!s) return null
  switch (s) {
    case "visual":
      return "visual"
    case "auditory":
      return "auditivo"
    case "reading":
      return "lectura_escritura"
    case "kinesthetic":
      return "kinestesico"
    case "mixed":
      return "mixto"
    default:
      return null
  }
}

export function mapDisabilities(arr: string[] | undefined | null) {
  if (!arr || arr.length === 0) return null
  return arr.map((d) => {
    const v = d.toLowerCase()
    if (v.includes("ninguna") || v === "ninguna") return "ninguna"
    if (v.includes("motriz")) return "motora"
    if (v.includes("visual")) return "visual"
    if (v.includes("auditiva")) return "auditiva"
    if (v.includes("intelectual") || v.includes("cognit")) return "cognitiva"
    return "otra"
  })
}

export function normalizePhone(phone: string | undefined | null) {
  if (!phone) return null
  return phone.trim()
}
