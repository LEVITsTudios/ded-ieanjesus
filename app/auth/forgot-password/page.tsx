import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata = {
  title: 'Recuperar contraseña',
  description: 'Recupera tu contraseña de forma segura',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <ForgotPasswordForm />
    </div>
  )
}
