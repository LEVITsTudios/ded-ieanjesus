import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', margin: '1rem 0' }}>Página no encontrada</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>
          Lo sentimos, no pudimos encontrar la página que buscas.
        </p>
        <div style={{ display: 'flex', gap: '1rem', margin: '2rem 0', flexDirection: 'column' }}>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            backgroundColor: '#3b82f6',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Ir al Panel
          </Link>
          <Link href="/" style={{
            display: 'inline-block',
            backgroundColor: '#e5e7eb',
            color: '#000',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
