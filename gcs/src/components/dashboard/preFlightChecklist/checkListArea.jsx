/*
  The Checklist area, this can be edited.
*/

import { Button, Checkbox, Textarea} from "@mantine/core"
import { useEffect, useState } from "react"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function CheckListArea({items, saveItems}) {
  const [editMode, setEditMode] = useState(false)
  const [checkBoxList, setCheckboxList] = useState(items)
  const [checkBoxListString, setCheckboxListString] = useState(generateCheckboxListString())
  const [mappedItems, setMappedItems] = useState(generateMappedItems())

  function generateCheckboxListString(set = false) {
    // Go from list to string, returns
    var final = ""
    checkBoxList.map((element) => {
      final += element.name + ", "
    })

    final = final.substring(0, final.length - 2)
    if (set) {
      setCheckboxListString(final)
    }

    return final
  }

  function generateCheckboxList() {
    // Go from string to list, does not return
    var final = []
    checkBoxListString.split(/,\s|,/).map((element) => {
      final.push({
        "checked": false,
        "name": element.trimStart()
      })
    })
    setCheckboxList(final)
  }

  function setChecked(name, value) {
    var final = []
    checkBoxListString.split(/,\s|,/).map((element) => {
      final.push({
        "checked": element.trimStart() == name ? value : checkBoxList.find((e) => e.name == element.trimStart()).checked,
        "name": element.trimStart()
      })
    })
    setCheckboxList(final)
  }

  function generateMappedItems() {
    return (
      checkBoxList.map((element) => {
        return <Checkbox checked={element.checked} key={element.name} label={element.name} onChange={() => setChecked(element.name, !element.checked)}/>
      })
    )
  }

  useEffect(() => {
    setMappedItems(generateMappedItems())
    saveItems(checkBoxList)
  }, [checkBoxList])

  return (
    <>
      {/* Checkbox area */}
      <div className={`flex flex-col gap-2 ${editMode ? "hidden" : ""}`}>
        {mappedItems}

        <div className="flex w-full justify-between pt-2">
          <a className="text-xs text-falcongrey-400 hover:underline hover:cursor-pointer" onClick={() => generateCheckboxList()}>Reset all checked</a>
          <a className="text-xs text-falcongrey-400 hover:underline hover:cursor-pointer" onClick={() => setEditMode(true)}>Edit this checklist</a>
        </div>
      </div>
      
      {/* Edit mode */}
      <div className={`flex flex-col gap-2 ${editMode ? "" : "hidden"}`}>
        <Textarea value={checkBoxListString} onChange={(e) => setCheckboxListString(e.currentTarget.value)}/>

        <div className="w-full flex justify-between">
          <Button 
            onClick={() => {setEditMode(false); generateCheckboxListString(true)}} 
            variant="filled"
            type="submit"
            color={tailwindColors.red[600]}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {setEditMode(false); generateCheckboxList()}} 
            variant="filled"
            type="submit"
            color={tailwindColors.green[600]}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  )
}