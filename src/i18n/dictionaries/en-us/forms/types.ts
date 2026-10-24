export interface Forms {
  controls: {
    requiredIndicator: string
    required: string
    showPassword: string
    hidePassword: string
    clearFile: string
  }
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
