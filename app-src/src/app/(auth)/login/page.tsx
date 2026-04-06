import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">OOH Manager</h1>
          <p className="text-muted-foreground text-sm">
            Acesse sua conta para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
