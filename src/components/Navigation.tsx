import { useLocation } from 'react-router-dom'
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav'

const navItems = [
  { path: '/', label: 'Escanear imagen' },
  { path: '/escanear-camara', label: 'Escanear con cámara' },
  { path: '/generar', label: 'Generar QR' },
] as const

function Navigation() {
  const { pathname } = useLocation()

  return (
    <TopNav
      label="Navegación principal"
      heading={<TopNavHeading heading="Lector QR" headingHref="/" />}
      startContent={navItems.map((item) => (
        <TopNavItem
          key={item.path}
          label={item.label}
          href={item.path}
          isSelected={pathname === item.path}
        />
      ))}
    />
  )
}

export default Navigation
