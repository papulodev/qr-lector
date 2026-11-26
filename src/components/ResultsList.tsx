import { List, ListItem } from '@astryxdesign/core/List'
import { Section } from '@astryxdesign/core/Section'
import { Heading, Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/Stack'
import type { QRResult } from '../types/qr'
import { parseQR } from '../utils/parseQR'

interface ResultsListProps {
  results: QRResult[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function ResultsList({ results, selectedIndex, onSelect }: ResultsListProps) {
  return (
    <Section padding={4}>
      <List
        header={
          <VStack gap={0.5}>
            <Heading level={2}>Códigos encontrados</Heading>
            <Text type="supporting" color="secondary">
              {results.length} {results.length === 1 ? 'código encontrado' : 'códigos encontrados'}
            </Text>
          </VStack>
        }
        hasDividers
      >
        {results.map((result, index) => {
          const parsed = parseQR(result.data)
          return (
            <ListItem
              key={`${index}-${result.data}`}
              label={`QR ${index + 1} · ${parsed.type}`}
              description={parsed.sub || result.data}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(index)}
            />
          )
        })}
      </List>
    </Section>
  )
}

export default ResultsList
