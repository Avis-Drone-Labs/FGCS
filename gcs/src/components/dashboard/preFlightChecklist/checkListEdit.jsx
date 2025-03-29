/*
  The modal to edit a checklist
*/

import { Button, Modal, TextInput } from "@mantine/core";

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function EditCheckList({opened, close, nameSet, checkListSet, generateCheckboxListString, generateCheckboxList}) {
  const [name, setName] = nameSet
  const [checkboxList, setCheckboxLate] = checkListSet

  return (
    <Modal 
      title="Edit Checklist" 
      opened={opened} 
      onClose={() => close()} 
      styles={{
        content: {
          borderRadius: "0.5rem",
        },
      }}
      size={"xl"}
      centered
    >
      <div className="flex flex-col gap-2">
        {/* Inputs */}
        <TextInput
          label="Checklist Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput 
          label="Values"
          description="The checklist items in a comma separated list"
          value={checkboxList} 
          onChange={(e) => setCheckboxLate(e.currentTarget.value)}
        />

        {/* Controls */}
        <div className="w-full flex justify-between pt-2">
          <Button 
            onClick={() => {close(); generateCheckboxListString(true)}} 
            variant="filled"
            type="submit"
            color={tailwindColors.red[600]}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {close(); generateCheckboxList()}} 
            variant="filled"
            type="submit"
            color={tailwindColors.green[600]}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}