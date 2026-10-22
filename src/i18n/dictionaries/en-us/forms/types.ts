export interface Forms {
  labels: { name: string; email: string; message: string }
  placeholders: { name: string; email: string; message: string }
  messages: {
    required: string
    invalidEmail: string
    success: string
    error: string
  }
}
