import { VStack } from '@astryxdesign/core/Stack'
import { Heading, Text } from '@astryxdesign/core/Text'
import QRGenerator from '../components/QRGenerator'

function GeneratePage() {
  return (
    <VStack gap={6}>
      <VStack gap={2} maxWidth="70ch">
        <Heading level={1}>Generar QR</Heading>
        <Text as="p" type="large" color="secondary">
          Creá un código QR para compartir URLs, contactos, redes Wi-Fi y más. Todo se genera en tu navegador.
        </Text>
      </VStack>
      <QRGenerator />
    </VStack>
  )
}

export default GeneratePage
