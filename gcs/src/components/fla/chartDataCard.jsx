/*
  A custom component for each message card (seen at the bottom of the screen on FLA).
  This holds information about the colour of the line, and its mean, max, min.
*/

// 3rd Party Imports
import { ActionIcon, ColorInput, Box } from '@mantine/core'
import { IconTrash, IconPaint } from '@tabler/icons-react'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function ChartDataCard({
  item,
  messageMeans,
  colorInputSwatch,
  changeColorFunc,
  removeDatasetFunc,
}) {
  return (
    <div className='inline-flex flex-col items-center gap-2 px-2 py-2 mr-3 text-xs font-bold text-white border border-gray-700 rounded-lg bg-grey-200'>
      {/* Title and Delete Button */}
      <div className='inline-flex items-center content-center justify-between w-full'>
        <span className='text-md'>{item.label}</span>
        <ActionIcon
          variant='subtle'
          color={tailwindColors.red[500]}
          onClick={() => removeDatasetFunc(item.label)}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </div>

      {/* Color Selector */}
      <ColorInput
        className='w-full text-xs'
        size='xs'
        format='hex'
        swatches={colorInputSwatch}
        closeOnColorSwatchClick
        withEyeDropper={false}
        value={item.borderColor}
        rightSection={<IconPaint size={16} />}
        onChangeEnd={(color) => changeColorFunc(item.label, color)}
      />

      {/* Min, max, min */}
      <Box className='w-full text-gray-400'>
        Min: {messageMeans[item.label]['min']}, Max:{' '}
        {messageMeans[item.label]['max']}, Mean:{' '}
        {messageMeans[item.label]['mean']}
      </Box>
    </div>
  )
}
