/*
  File description?
*/

import { MultiSelect, ScrollArea } from "@mantine/core"
import { useEffect, useListState } from "react"


export default function BitmaskSelect({ className, value, onChange, param, options }) {
  const [selected, selectedHandler] = useListState([])

  useEffect(() => {
    parseBitmask(value)
  }, [value])

  function parseBitmask(bitmaskToParse) {
    const binaryString = dec2bin(bitmaskToParse)
    const selectedArray = []

    binaryString
    .split('')
    .reverse()
    .map((bit, index) => {
      if (bit === '1') {
        selectedArray.push(`${index}`)
      }
    })

    selectedHandler.setState(selectedArray)
  }

  function createBitmask(value) {
    const initialValue = 0
    const bitmask = value.reduce(
      (accumulator, currentValue) => accumulator + 2 ** parseInt(currentValue),
      initialValue,
    )
    selectedHandler.setState(value)
    console.log(bitmask)
    onChange(bitmask, param)
  }

  function dec2bin(dec) {
    return (dec >>> 0).toString(2)
  }

  return (
    <ScrollArea.Autosize className={`${className} max-h-24`}>
      <MultiSelect
        value={selected}
        onChange={createBitmask}
        data={Object.keys(options).map((key) => ({
          value: `${key}`,
          label: `${options[key]}`
        }))}
      />
    </ScrollArea.Autosize>
  )
}
