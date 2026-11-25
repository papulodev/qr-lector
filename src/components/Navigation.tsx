import { NavLink } from 'react-router-dom'

function Navigation() {
  const navItems = [
    { path: '/', label: 'Escanear imagen' },
    { path: '/escanear-camara', label: 'Escanear con cámara' },
    { path: '/generar', label: 'Generar QR' },
  ] as const

  return (
    <nav className="nav" aria-label="Navegación principal">
      <ul style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--ink)',
                fontWeight: isActive ? 700 : 500,
                padding: '8px 16px',
                borderRadius: '4px',
                background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                border: '1.5px solid',
                borderColor: isActive ? 'var(--accent)' : 'var(--line)',
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navigation