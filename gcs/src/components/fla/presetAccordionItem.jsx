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

// Utility function to convert a string to title case
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}


export default function PresetAccordionItem({
  category,
  selectPresetFunc,
  aircraftType,
  deleteCustomPreset,
}) {
  
  // Filter out filters that don't match the current aircraft type
  const filteredFilters = category.filters.filter(filter => 
    filter.aircraftType === undefined || 
    filter.aircraftType.includes(aircraftType)
  );

  const isCustomPreset = category.name === 'Custom Presets';

  return (
    <Accordion.Item value={category.name}>
      <Accordion.Control className="rounded-md">{category.name}</Accordion.Control>
      <Accordion.Panel>
        <div className='flex flex-col gap-2'>
          {filteredFilters.length === 0 ? (
            <div className='flex items-center justify-center py-4'>
              <IconInfoCircle size={20} />
              <p className='ml-2'>
                No Saved {aircraftType ? toTitleCase(aircraftType) : ''} {isCustomPreset ? 'Custom Preset' : 'Preset'}
              </p>
            </div>
          ) : (
            filteredFilters.map((filter, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <MantineTooltip label={<p className='text-center text-wrap line-clamp-3 max-w-96'>{filter.name}</p>} withArrow position='right' arrowSize={10} arrowOffset={15}>
                  <Button
                    onClick={() => selectPresetFunc(filter)}
                    className='flex-1'
                  >
                    <p className='text-wrap line-clamp-1'>
                      {filter.name}
                    </p>
                  </Button>
                </MantineTooltip>

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
            ))
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}