/**
 * PreFlightCheckListSection
 * Contains the preflight checklist
 */

import { Tabs, Accordion, Button, Modal, TextInput, ScrollArea } from "@mantine/core";
import CheckListArea from "../preFlightChecklist/checkListArea.jsx";
import { useLocalStorage } from "@mantine/hooks";

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
import { useState } from "react";
import { showErrorNotification } from "../../../helpers/notification.js";
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function PreFlightChecklistTab({tabPadding}) {
  const [preFlightChecklistItems, setPreFlightChecklistItems] = useLocalStorage({ key: "preFlightCheckList", defaultValue: []})
  const [openChecklist, setOpenChecklist] = useLocalStorage({ key: "lastOpenedPreFlightCheckList", defaultValue: "" })
  
  // New checklist
  const [showNewChecklistModal, setNewChecklistModal] = useState(false)
  const [newChecklistName, setNewChecklistName] = useState("");

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
      preFlightChecklistItems.push({ "name": newChecklistName, "value": [ {"checked": false, "name": "Click 'Edit this checklist' to add new values"} ] })
      setPreFlightChecklistItems(preFlightChecklistItems)
      setOpenChecklist(newChecklistName)
      setNewChecklistModal(false)
      setNewChecklistName("")
      return
    }

    // Show error message
    showErrorNotification("Name cannot be empty")
  }

  const items = preFlightChecklistItems.map((item) => (
    <Accordion.Item key={item.name} value={item.name} onClick={() => setOpenChecklist(item.name)}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <CheckListArea 
          items={item.value} 
          saveItems={(e) => { item.value = e; setPreFlightChecklistItems(preFlightChecklistItems) }} 
          deleteChecklist={() => deleteChecklist(item)}
          name={item.name}
        />
      </Accordion.Panel>
    </Accordion.Item>
  ));
  
  return (
    <Tabs.Panel value="preFlightChecklist">
      <div className={tabPadding}>
        {/* List */}
        <Accordion variant="separated" defaultValue={openChecklist}>
          {items}
        </Accordion>
        {/* Controls */}
        <Button className="!w-full !mt-4" onClick={() => setNewChecklistModal(true)}>Add a new Checklist</Button>

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
          <div className="flex flex-col gap-2">
            <TextInput
              label="Checklist Name"
              description="The name of the checklist, you can add values afterwards"
              value={newChecklistName}
              onChange={(event) => setNewChecklistName(event.currentTarget.value)}
            />
          </div>

          <div className="flex w-full justify-between pt-6">
            <Button color={tailwindColors.red[600]} onClick={() => setNewChecklistModal(false)}>Cancel</Button>
            <Button color={tailwindColors.green[600]} onClick={() => createNewChecklist()}>Create</Button>
          </div>
        </Modal>
      </div>
    </Tabs.Panel>
  )
}
