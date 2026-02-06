import { RecoverAccountForm } from '@/components/auth/recover-account-form'

export const metadata = {
  title: 'Recuperar cuenta',
  description: 'Recupera tu cuenta usando tu correo o cédula',
}

export default function RecoverAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <RecoverAccountForm />
    </div>
  )
}
