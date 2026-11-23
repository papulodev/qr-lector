import QRGenerator from '../components/QRGenerator'

function GeneratePage() {
  return (
    <main>
      <h1>Generar QR</h1>
      <p className="lead">
        Creá un código QR para compartir URLs, contactos, redes Wi-Fi y más. Todo se genera en tu navegador.
      </p>
      <QRGenerator />
    </main>
  )
}

export default GeneratePage