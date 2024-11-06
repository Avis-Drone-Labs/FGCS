/*
  Holds each element for the preset accordion including the buttons to select them.
*/

// 3rd Party Imports
import { Accordion, Button, Tooltip } from '@mantine/core'

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
              <Tooltip label={<p className='text-center text-wrap line-clamp-3 max-w-96'>{filter.name}</p>} withArrow position='right' arrowSize={10} arrowOffset={15}>
                <Button
                  key={idx}
                  onClick={() => selectPresetFunc(filter)}
                >
                  <p className='text-wrap line-clamp-1'>
                    {filter.name}
                  </p>
                </Button>
              </Tooltip>
            )
          })}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
