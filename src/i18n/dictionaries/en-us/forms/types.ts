export interface Forms {
  labels: { name: string; email: string; phone: string; message: string }
  placeholders: { name: string; email: string; phone: string; message: string }
  messages: {
    required: string
    invalidEmail: string
    invalidPhone: string
    invalidInput: string
    tooLong: string
    forbidden: string
    success: string
    error: string
  }
}
