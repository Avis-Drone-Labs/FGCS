/*
  The Checklist area, this can be edited.
*/

// Native imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { ActionIcon, Button, Checkbox, Modal, Tooltip } from "@mantine/core"

// Local Imports
import EditCheckList from "./checkListEdit.jsx"

// Styling imports
import {
  IconCheckbox,
  IconEdit,
  IconFileExport,
  IconTrashX,
} from "@tabler/icons-react"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
import { generateCheckListObjectFromHTMLString } from "../../../helpers/checkList..js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  deleteChecklistById,
  selectChecklistById,
  setChecklistValueById,
} from "../../../redux/slices/checklistSlice.js"

export default function CheckListArea({ id }) {
  const dispatch = useDispatch()
  const checklist = useSelector(selectChecklistById(id))

  const [showDeleteModal, setDeleteModal] = useState(false)
  const [editCheckListModal, setEditCheckListModal] = useState(false)
  const [checkBoxListString, setCheckboxListString] = useState(
    generateCheckboxListString(),
  )
  const [mappedItems, setMappedItems] = useState(generateMappedItems())
  const [lastToggleCheck, setLastToggleCheck] = useState(false) // false = uncheck, true = check

  function generateCheckboxListString(set = false) {
    // Go from list to string, returns0
    var final = "<ul>"
    checklist.value.map((element) => {
      final += "<li><p>" + element.name + "</p></li>"
    })

    final += "</ul>"
    if (set) {
      setCheckboxListString(final)
    }

    return final
  }

  function generateCheckboxList(defaultCheck = false) {
    var final = generateCheckListObjectFromHTMLString(
      checkBoxListString,
      defaultCheck,
    )
    dispatch(setChecklistValueById({ id: checklist.id, value: final }))
  }

  function toggleCheck() {
    generateCheckboxList(lastToggleCheck)
    setLastToggleCheck(!lastToggleCheck)
  }

  function setChecked(name, value) {
    var final = []
    checkBoxListString
      .split("<li><p>")
      .splice(1)
      .map((element) => {
        var elementName = element.split("</p>")[0].trim()
        final.push({
          checked:
            elementName == name
              ? value
              : checklist.value.find((e) => e.name == elementName).checked,
          name: elementName,
        })
      })
    dispatch(setChecklistValueById({ id: checklist.id, value: final }))
  }

  function exportList() {
    // Remove id from checklist before exporting as it gets regenerated on importing
    let { ...sanitizedChecklist } = checklist
    delete sanitizedChecklist.id
    const downloadElement = document.createElement("a")
    const file = new Blob([JSON.stringify(sanitizedChecklist)], {
      type: "text/plain",
    })

    // Simulating clicking a link to download
    downloadElement.href = URL.createObjectURL(file)
    downloadElement.download = `${checklist.name}.checklist`
    document.body.appendChild(downloadElement)
    downloadElement.click()
    document.body.removeChild(downloadElement)
  }

  function generateMappedItems() {
    return checklist.value.map((element) => {
      return (
        <Checkbox
          checked={element.checked}
          key={element.name}
          label={element.name}
          onChange={() => setChecked(element.name, !element.checked)}
        />
      )
    })
  }

  useEffect(() => {
    setMappedItems(generateMappedItems())
    dispatch(
      setChecklistValueById({ id: checklist.id, value: checklist.value }),
    )
  }, [checklist.value])

  return (
    <>
      {/* Checkbox area */}
      <div className="flex flex-col gap-2">
        <div className="flex w-full justify-between pb-2">
          <div className="flex gap-1">
            <Tooltip label="Toggle Checked">
              <ActionIcon
                variant="light"
                radius="md"
                onClick={() => toggleCheck()}
              >
                <IconCheckbox
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit List">
              <ActionIcon
                variant="light"
                radius="md"
                onClick={() => setEditCheckListModal(true)}
              >
                <IconEdit
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Export List">
              <ActionIcon
                variant="light"
                radius="md"
                onClick={() => exportList()}
              >
                <IconFileExport
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
          </div>

          <div className="flex gap-1">
            <Tooltip label="Delete List">
              <ActionIcon
                variant="light"
                color="red"
                radius="md"
                onClick={() => setDeleteModal(true)}
              >
                <IconTrashX
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>

        {mappedItems}
      </div>

      {/* Edit mode */}
      <EditCheckList
        passedName={checklist.name}
        opened={editCheckListModal}
        close={() => setEditCheckListModal(false)}
        checklistId={checklist.id}
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
          <Button
            color={tailwindColors.red[600]}
            onClick={() => setDeleteModal(false)}
          >
            No, cancel
          </Button>
          <Button
            color={tailwindColors.green[600]}
            onClick={() => dispatch(deleteChecklistById(checklist.id))}
            data-autofocus
          >
            Yes, Continue
          </Button>
        </div>
      </Modal>
    </>
  )
}
