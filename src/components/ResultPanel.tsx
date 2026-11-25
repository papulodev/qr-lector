import { useState } from 'react'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { CodeBlock } from '@astryxdesign/core/CodeBlock'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Section } from '@astryxdesign/core/Section'
import { Heading, Text } from '@astryxdesign/core/Text'
import type { ParsedResult, QRResult } from '../types/qr'
import { getHostname, isShortenedUrl } from '../utils/urlSafety'

interface ResultPanelProps {
  result: QRResult | null
  error: string
  parsed: ParsedResult | null
  copied: string
  onCopy: () => void
  onRequestOpen: (url: string) => void
}

function ResultPanel({ result, error, parsed, copied, onCopy, onRequestOpen }: ResultPanelProps) {
  const [linkCopied, setLinkCopied] = useState('')

  const copyLink = async () => {
    if (!parsed?.link) return
    try {
      await navigator.clipboard.writeText(parsed.link)
      setLinkCopied('Enlace copiado')
      setTimeout(() => setLinkCopied(''), 2000)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = parsed.link
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setLinkCopied('Enlace copiado')
        setTimeout(() => setLinkCopied(''), 2000)
      } catch {
        setLinkCopied('No se pudo copiar')
        setTimeout(() => setLinkCopied(''), 2000)
      }
    }
  }

  const isShort = parsed?.link ? isShortenedUrl(parsed.link) : false
  const copyStatus = [copied, linkCopied].filter(Boolean).join(' · ')

  return (
    <Section id="out" padding={5} aria-live="polite">
      <VStack gap={4}>
        {!result && !error && (
          <EmptyState
            headingLevel={2}
            isCompact
            title="Sin resultado todavía"
            description="Acá vas a ver el contenido del QR: su tipo, los datos ordenados y el texto original."
          />
        )}

        {error && <Banner status="error" title={error} container="section" />}

        {parsed && result && (
          <>
            <VStack gap={0.5}>
              <Heading level={2}>{parsed.type}</Heading>
              <Text type="supporting" color="secondary">{parsed.sub}</Text>
            </VStack>

            {parsed.fields.length > 0 && (
              <MetadataList label={{ position: 'start' }}>
                {parsed.fields.map(([key, value], index) => (
                  <MetadataListItem key={`${key}-${index}`} label={key}>
                    <Text type="code" wordBreak="break-all">{value}</Text>
                  </MetadataListItem>
                ))}
              </MetadataList>
            )}

            {parsed.link && (
              <VStack gap={2}>
                <Text type="label" color="secondary">URL completa</Text>
                <CodeBlock
                  code={parsed.link}
                  title="URL completa"
                  size="sm"
                  isWrapped
                  hasLanguageLabel={false}
                  hasCopyButton={false}
                  container="section"
                  width="100%"
                />
                {isShort && (
                  <Banner
                    status="warning"
                    title="Este enlace usa un acortador"
                    description={`${getHostname(parsed.link)} puede redirigir a otra página con anuncios o trackers.`}
                    container="section"
                  />
                )}
              </VStack>
            )}

            {parsed.notes?.map((note, index) => (
              <Banner key={index} status="warning" title={note} container="section" />
            ))}

            <CodeBlock
              code={result.data}
              title="Contenido original"
              isWrapped
              hasLanguageLabel={false}
              hasCopyButton={false}
              container="section"
              width="100%"
            />

            <HStack gap={2} wrap="wrap">
              <Button label="Copiar contenido" variant="primary" onClick={onCopy} />
              {parsed.link && (
                <>
                  <Button label="Abrir enlace" onClick={() => onRequestOpen(parsed.link!)} />
                  <Button label="Copiar enlace" onClick={copyLink} />
                </>
              )}
            </HStack>

            <VStack gap={0.5}>
              <Text type="supporting" color="accent" role="status" aria-live="polite">
                {copyStatus}
              </Text>
              <Text type="supporting" color="secondary">
                Versión QR {result.version} · {result.data.length} caracteres
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </Section>
  )
}

export default ResultPanel
