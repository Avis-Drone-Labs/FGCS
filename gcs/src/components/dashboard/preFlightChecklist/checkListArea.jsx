/*
  The Checklist area, this can be edited.
*/

import { Button, Checkbox, Modal, Textarea, TextInput} from "@mantine/core"
import { useEffect, useState } from "react"
import EditCheckList from "./checkListEdit.jsx"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function CheckListArea({name, items, saveItems, deleteChecklist}) {
  const [showDeleteModal, setDeleteModal] = useState(false)
  const [editCheckListModal, setEditCheckListModal] = useState(false)
  const [checkListName, setChecklistName] = useState(name);
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
      <div className="flex flex-col gap-2">
        {mappedItems}

        <div className="flex w-full justify-between pt-2">
          <a className="text-xs text-falcongrey-200 hover:underline hover:cursor-pointer" onClick={() => generateCheckboxList()}>Uncheck all</a>
        </div>
        <div className="flex w-full justify-between flex-row-reverse">
          <a className="text-xs text-falconred-400 hover:underline hover:cursor-pointer" onClick={() => setDeleteModal(true)}>Delete this checklist</a>
          <a className="text-xs text-falcongrey-200 hover:underline hover:cursor-pointer" onClick={() => setEditCheckListModal(true)}>Edit this checklist</a>
        </div>
      </div>
      
      {/* Edit mode */}
      <EditCheckList 
        opened={editCheckListModal} 
        close={() => setEditCheckListModal(false)} 
        nameSet={[checkListName, setChecklistName]} 
        checkListSet={[checkBoxListString, setCheckboxListString]}
        generateCheckboxListString={generateCheckboxListString}
        generateCheckboxList={generateCheckboxList}
      />

      {/* Generic "are you sure" modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setDeleteModal(false)}
        title="Are you sure you want to delete this checklist?"
        centered
        styles={{
          content: {
            borderRadius: "0.5rem",
          },
        }}
        withCloseButton={false}
      >
        <div className="flex w-full justify-between pt-4">
          <Button color={tailwindColors.red[600]} onClick={() => setDeleteModal(false)}>No, cancel</Button>
          <Button color={tailwindColors.green[600]} onClick={() => deleteChecklist()}>Yes, Continue</Button>
        </div>
      </Modal>
    </>
  )
}