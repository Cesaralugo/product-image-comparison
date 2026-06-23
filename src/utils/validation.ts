export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateProductReference = (ref: string): boolean => {
  return ref.trim().length > 0
}

export const validateImagePath = (path: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const lowercasePath = path.toLowerCase()
  return validExtensions.some((ext) => lowercasePath.endsWith(ext))
}

export const validateCSVFile = (file: File): boolean => {
  return file.type === 'text/csv' || file.name.endsWith('.csv')
}
