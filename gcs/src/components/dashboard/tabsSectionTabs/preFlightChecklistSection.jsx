/**
 * PreFlightCheckListSection
 * Contains the preflight checklist
 */

// Native imports
import { useState } from "react"

// 3rd Party Imports
import { Tabs, Accordion, Button, Modal, TextInput } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Local imports
import CheckListArea from "../preFlightChecklist/checkListArea.jsx"
import { showErrorNotification } from "../../../helpers/notification.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
import { AddCommand } from "../../spotlight/commandHandler.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function PreFlightChecklistTab({ tabPadding }) {
  const [preFlightChecklistItems, setPreFlightChecklistItems] = useLocalStorage(
    { key: "preFlightCheckList", defaultValue: [] },
  )
  const [openChecklist, setOpenChecklist] = useLocalStorage({
    key: "lastOpenedPreFlightCheckList",
    defaultValue: "",
  })

  // New checklist
  const [showNewChecklistModal, setNewChecklistModal] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState("")

  function deleteChecklist(toDelete) {
    var final = []
    preFlightChecklistItems.map((element) => {
      if (element != toDelete) {
        final.push(element)
      }
    })
    setPreFlightChecklistItems(final)
  }

  function createNewChecklist() {
    if (newChecklistName !== "") {
      preFlightChecklistItems.push({
        name: newChecklistName,
        value: [
          {
            checked: false,
            name: "Your first item, press edit to add more!",
          },
        ],
      })
      setPreFlightChecklistItems(preFlightChecklistItems)
      setOpenChecklist(newChecklistName)
      setNewChecklistModal(false)
      setNewChecklistName("")
      return
    }

    // Show error message
    showErrorNotification("Name cannot be empty")
  }

  // Add create new checklist as a spotlight command
  AddCommand("new_preflight_checklist", () => setNewChecklistModal(true))

  const items = preFlightChecklistItems.map((item) => (
    <Accordion.Item
      key={item.name}
      value={item.name}
      onClick={() => setOpenChecklist(item.name)}
    >
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <CheckListArea
          items={item.value}
          saveItems={(e) => {
            item.value = e
            setPreFlightChecklistItems(preFlightChecklistItems)
          }}
          deleteChecklist={() => deleteChecklist(item)}
          name={item.name}
          setName={(e) => {
            item.name = e
            setOpenChecklist(e)
          }}
        />
      </Accordion.Panel>
    </Accordion.Item>
  ))

  return (
    <Tabs.Panel value="preFlightChecklist">
      <div className={tabPadding}>
        {/* List, known issue of not opening the same list if name was changed but it's not worth it */}
        <Accordion variant="separated" defaultValue={openChecklist}>
          {items}
        </Accordion>
        {/* Controls */}
        <Button
          className="!w-full !mt-4"
          onClick={() => setNewChecklistModal(true)}
        >
          Add a new Checklist
        </Button>

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
