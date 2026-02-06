"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewUserPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [phone, setPhone] = useState('')
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !fullName) {
      setError('Email y nombre completos son requeridos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role, phone, dni })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Error creando usuario')
      }

      router.push('/dashboard/users')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nombre completo</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Pérez" />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Rol</label>
              <Select onValueChange={(v) => setRole(v)} value={role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="teacher">Maestro</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="parent">Padre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Teléfono (opcional)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5512345678" />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">DNI (opcional)</label>
              <Input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI" />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear Usuario'}</Button>
              <Button variant="ghost" onClick={() => router.push('/dashboard/users')}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
