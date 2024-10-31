/*
  Holds each element for the preset accordion including the buttons to select them.
*/

// 3rd Party Imports
import {
  Accordion,
  Button,
  ActionIcon,
  Tooltip as MantineTooltip,
} from '@mantine/core'
import { IconTrash, IconInfoCircle } from '@tabler/icons-react'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function PresetAccordionItem({
  category,
  selectPresetFunc,
  aircraftType,
  deleteCustomPreset,
}) {
  return (
    <Accordion.Item value={category.name}>
      <Accordion.Control>{category.name}</Accordion.Control>
      <Accordion.Panel>
        <div className='flex flex-col gap-2'>
          {category.filters.length === 0 ? (
            <div className='flex justify-center items-center p-4'>
              <IconInfoCircle size={20} />
              <p className='ml-2'>No Saved Custom Preset</p>
            </div>
          ) : (
            category.filters.map((filter, idx) => {
              if (
                filter.aircraftType !== undefined &&
                !filter.aircraftType.includes(aircraftType)
              ) {
                return null
              }

              const isCustomPreset = category.name === 'Custom Presets'

              return (
                <div key={idx} className='flex items-center gap-2'>
                  <Button
                    onClick={() => selectPresetFunc(filter)}
                    className='flex-1'
                  >
                    {filter.name}
                  </Button>

                  {/* Add delete button if isCustomPreset */}
                  {isCustomPreset && (
                    <MantineTooltip label='Delete Preset'>
                      <ActionIcon
                        variant='light'
                        color={tailwindColors.red[500]}
                        onClick={() => deleteCustomPreset(filter.name)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </MantineTooltip>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
