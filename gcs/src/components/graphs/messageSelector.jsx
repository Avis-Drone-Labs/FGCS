/*
  MessageSelector Component

  This component is a custom Select component that allows users to select a message from a list of options.
  The options are grouped by message name and are searchable. The selected value is stored in the currentValues object.

  Props:
    - graphOptions: An object containing the available options for each message.
    - label: The label for the Select component.
    - labelColor: The color for the label.
    - valueKey: The key used to store the selected value in the currentValues object.
    - currentValues: An object containing the currently selected values.
    - setValue: A function used to set the selected value.
*/

// 3rd Party Imports
import { Select } from '@mantine/core'

export default function MessageSelector({
    graphOptions,
    label,
    labelColor,
    valueKey,
    currentValues,
    setValue,
  }) {
    return (
      <Select
        label={label}
        classNames={{ option: 'capitalize', label: labelColor }}
        data={Object.keys(graphOptions).map((messageName) => ({
          group: messageName,
          items: graphOptions[messageName].map((v) => ({
            value: `${messageName}/${v}`,
            label: v,
          })),
        }))}
        searchable
        value={currentValues[valueKey]}
        onChange={(value) => {
          setValue({ [valueKey]: value })
        }}
      />
    )
  }