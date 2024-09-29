/*
  Holds each element for the preset accordion including the buttons to select them.
*/

// 3rd Party Imports
import { Accordion, Button } from '@mantine/core'

export default function PresetAccordionItem({
  category,
  selectPresetFunc,
  aircraftType,
}) {
  return (
    <Accordion.Item value={category.name}>
      <Accordion.Control>{category.name}</Accordion.Control>
      <Accordion.Panel>
        <div className='flex flex-col gap-2'>
          {category.filters.map((filter, idx) => {
            if (
              filter.aircraftType !== undefined &&
              !filter.aircraftType.includes(aircraftType)
            ) {
              return null
            }

            return (
              <Button key={idx} onClick={() => selectPresetFunc(filter)}>
                {filter.name}
              </Button>
            )
          })}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
