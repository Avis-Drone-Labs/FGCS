/*
  Custom divider for menu dropdowns, in once place to make them easier to edit
*/

// Third Party Imports
import { Divider as MantineDivider } from '@mantine/core'

// Styling Imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../../tailwind.config.js'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Divider() {
  return (
    <MantineDivider className="px-1 my-1" color={tailwindColors["falcongrey"][600]} size="sm"/>
  )
}