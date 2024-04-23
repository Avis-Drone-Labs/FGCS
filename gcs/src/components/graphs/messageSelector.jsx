import React from 'react';

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