import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AppShell } from '@astryxdesign/core/AppShell'
import { LinkProvider } from '@astryxdesign/core/Link'
import { VStack } from '@astryxdesign/core/Stack'
import Navigation from './components/Navigation'
import ScanPage from './pages/ScanPage'
import GeneratePage from './pages/GeneratePage'
import CameraPage from './pages/CameraPage'

function App() {
  return (
    <BrowserRouter>
      <LinkProvider component={Link}>
        <AppShell
          height="auto"
          variant="surface"
          contentPadding={6}
          topNav={<Navigation />}
        >
          <VStack data-app-content width="100%" maxWidth="120ch" gap={0}>
            <Routes>
              <Route path="/" element={<ScanPage />} />
              <Route path="/generar" element={<GeneratePage />} />
              <Route path="/escanear-camara" element={<CameraPage />} />
            </Routes>
          </VStack>
        </AppShell>
      </LinkProvider>
    </BrowserRouter>
  )
}

export default App
