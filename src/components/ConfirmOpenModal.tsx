import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { CodeBlock } from '@astryxdesign/core/CodeBlock'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { getHostname, isShortenedUrl } from '../utils/urlSafety'

interface ConfirmOpenModalProps {
  url: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmOpenModal({ url, open, onConfirm, onCancel }: ConfirmOpenModalProps) {
  const isShort = isShortenedUrl(url)
  const host = getHostname(url)

  return (
    <Dialog
      isOpen={open}
      onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}
      purpose="required"
      width={520}
      padding={5}
    >
      <VStack gap={4}>
        <DialogHeader
          title="Abrir enlace"
          subtitle="Vas a abrir una URL externa. Revisala antes de continuar."
          hasDivider={false}
        />

        <MetadataList label={{ position: 'start' }}>
          <MetadataListItem label="Dominio">
            <Text weight="semibold">{host}</Text>
          </MetadataListItem>
        </MetadataList>

        <VStack gap={1}>
          <Text type="label" color="secondary">URL completa</Text>
          <CodeBlock
            code={url}
            title="URL completa"
            size="sm"
            isWrapped
            hasLanguageLabel={false}
            hasCopyButton={false}
            container="section"
            width="100%"
          />
        </VStack>

        {isShort && (
          <Banner
            status="warning"
            title="Este enlace usa un acortador"
            description={`${host} puede redirigir a otra página con anuncios o trackers.`}
            container="section"
          />
        )}

        <HStack gap={2} hAlign="end" wrap="wrap">
          <Button label="Cancelar" onClick={onCancel} />
          <Button label="Abrir de todas formas" variant="primary" onClick={onConfirm} />
        </HStack>
      </VStack>
    </Dialog>
  )
}

export default ConfirmOpenModal
