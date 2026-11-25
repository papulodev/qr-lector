import { useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { List, ListItem } from '@astryxdesign/core/List'
import { Section } from '@astryxdesign/core/Section'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Heading, Text } from '@astryxdesign/core/Text'
import type { HistoryItem } from '../types/history'
import { clearHistory, loadHistory } from '../utils/history'

interface HistoryPanelProps {
  onSelect: (item: HistoryItem) => void
}

function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>(loadHistory())
  const refresh = () => setItems(loadHistory())

  const handleClear = () => {
    clearHistory()
    setItems([])
  }

  return (
    <Section padding={5} aria-labelledby="history-heading">
      <VStack gap={4}>
        <HStack gap={2} wrap="wrap" justify="between" vAlign="center">
          <Heading id="history-heading" level={2}>
            {items.length > 0 ? `Historial (últimos ${items.length})` : 'Historial'}
          </Heading>
          <HStack gap={2} wrap="wrap">
            {items.length > 0 && <Button label="Limpiar" variant="destructive" onClick={handleClear} />}
            <Button label="Actualizar" onClick={refresh} />
          </HStack>
        </HStack>

        {items.length === 0 ? (
          <EmptyState
            headingLevel={3}
            isCompact
            title="Historial vacío"
            description="Los códigos QR que escanees aparecerán acá."
            actions={<Button label="Escanear una imagen" href="/" variant="secondary" />}
          />
        ) : (
          <List density="compact" hasDividers edge="flush">
            {items.map((item) => (
              <ListItem
                key={item.id}
                itemKey={item.id}
                label={item.parsedType}
                description={
                  <VStack gap={0.5}>
                    <Text type="supporting">{item.parsedSub}</Text>
                    <Text type="code" wordBreak="break-all">{item.link || item.data}</Text>
                  </VStack>
                }
                endContent={
                  <Text type="supporting" color="secondary">
                    {new Date(item.date).toLocaleString()}
                  </Text>
                }
                onClick={() => onSelect(item)}
              />
            ))}
          </List>
        )}
      </VStack>
    </Section>
  )
}

export default HistoryPanel
