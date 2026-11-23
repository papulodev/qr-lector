import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ScanPage from './pages/ScanPage'
import GeneratePage from './pages/GeneratePage'
import CameraPage from './pages/CameraPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/generar" element={<GeneratePage />} />
          <Route path="/escanear-camara" element={<CameraPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App