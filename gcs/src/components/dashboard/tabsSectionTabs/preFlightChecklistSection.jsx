/**
 * PreFlightCheckListSection
 * Contains the preflight checklist
 */

// Native imports
import { useEffect, useRef, useState } from "react"

// 3rd Party Imports
import {
  Accordion,
  Button,
  FileInput,
  Modal,
  Tabs,
  TextInput,
} from "@mantine/core"

// Local imports
import CheckListArea from "../preFlightChecklist/checkListArea.jsx"

// Other
import { AddCommand } from "../../spotlight/commandHandler.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
import { showErrorNotification } from "../../../helpers/notification.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  pushChecklist,
  selectChecklists,
} from "../../../redux/slices/checklistSlice.js"

export default function PreFlightChecklistTab({ tabPadding }) {
  const dispatch = useDispatch()
  const preFlightChecklistItems = useSelector(selectChecklists)

  // New checklist
  const [uploadedFile, setUploadedFile] = useState(null) // Needed so we can reset the uploaded file each click to avoid missed clicks as we use onChange for FileInput
  const [showNewChecklistModal, setNewChecklistModal] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState("")
  const fileUploadRef = useRef()

  function doesChecklistExist(name) {
    return (
      preFlightChecklistItems.find(
        (element) => element.name.toLowerCase() == name.toLowerCase(),
      ) !== undefined
    )
  }

  function createNewChecklist(name, value) {
    if (!name) {
      name = newChecklistName
    }
    if (doesChecklistExist(name)) {
      // In the future we can make this show a popup and allow them to change the name
      showErrorNotification(`A checklist called '${name}' already exists`)
      return
    }
    if (!value) {
      value = [
        {
          checked: false,
          name: "Your first item, press edit to add more!",
        },
      ]
    }

    if (name == "") {
      showErrorNotification("Name cannot be empty")
    }

    dispatch(
      pushChecklist({
        name: name,
        value: value,
      }),
    )
    setNewChecklistModal(false)
    setNewChecklistName("")
  }

  useEffect(() => {
    AddCommand("new_preflight_checklist", () => setNewChecklistModal(true))
  }, [])

  // Import checklist
  function uploadChecklist(file) {
    if (file === null) return

    const reader = new FileReader()
    reader.onerror = () => {
      showErrorNotification("Failed to read checklist file")
    }

    // Read text
    reader.onload = () => {
      var text = reader.result
      var checkListObject = JSON.parse(text)
      createNewChecklist(checkListObject.name, checkListObject.value)
    }
    reader.readAsText(file)
  }

  // Reset checklist upload when changed (needed so we don't miss clicks)
  useEffect(() => {
    if (uploadedFile == null) return
    setUploadedFile(null)
  }, [uploadedFile])

  return (
    <Tabs.Panel value="preFlightChecklist">
      <div className={tabPadding}>
        {/* The list of checklist */}
        <Accordion variant="separated">
          {preFlightChecklistItems.map((item) => (
            <Accordion.Item key={item.id} value={item.name}>
              <Accordion.Control>{item.name}</Accordion.Control>
              <Accordion.Panel>
                <CheckListArea
                  id={item.id}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        {/* Controls */}
        <Button
          className="!w-full !mt-4"
          onClick={() => setNewChecklistModal(true)}
        >
          Add a new Checklist
        </Button>
        <Button
          className="!w-full !mt-2"
          onClick={() => fileUploadRef.current?.click()}
        >
          Import from Checklist file
        </Button>

        {/* File input for import (hidden and controlled via a click from a function) */}
        <div hidden>
          <FileInput
            ref={fileUploadRef}
            value={uploadedFile}
            onChange={(file) => {
              setUploadedFile(file)
              uploadChecklist(file)
            }}
          />
        </div>

        {/* New checklist modal */}
        <Modal
          opened={showNewChecklistModal}
          onClose={() => setNewChecklistModal(false)}
          title="New Checklist"
          centered
          styles={{
            content: {
              borderRadius: "0.5rem",
            },
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createNewChecklist()
            }}
          >
            <div className="flex flex-col gap-2">
              <TextInput
                label="Checklist Name"
                description="The name of the checklist, you can add values afterwards"
                value={newChecklistName}
                onChange={(event) =>
                  setNewChecklistName(event.currentTarget.value)
                }
                data-autofocus
              />
            </div>

            <div className="flex w-full justify-between pt-6">
              <Button
                color={tailwindColors.red[600]}
                onClick={() => setNewChecklistModal(false)}
              >
                Cancel
              </Button>
              <Button
                color={tailwindColors.green[600]}
                onClick={() => createNewChecklist()}
              >
                Create
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Tabs.Panel>
  )
}
