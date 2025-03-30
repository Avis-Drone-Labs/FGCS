/*
  Preflight checklist modal, a popup that allows the user to tick off things for their flight
*/

import { Modal, Accordion, Button } from "@mantine/core"
import CheckListArea from "./checkListArea"
import { useLocalStorage } from "@mantine/hooks"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function PreFlightChecklist({ showModal, setShowModal }) {
  const [preFlightChecklistItems, setPreFlightChecklistItems] = useLocalStorage(
    { key: "preFlightCheckList", defaultValue: [] },
  )
  const [openChecklist, setOpenChecklist] = useLocalStorage({
    key: "lastOpenedPreFlightCheckList",
    defaultValue: "",
  })

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
        />
      </Accordion.Panel>
    </Accordion.Item>
  ))

  return (
    <Modal
      opened={showModal}
      onClose={() => setShowModal(false)}
      size={"xl"}
      title="Preflight Checklist"
      centered
      styles={{
        content: {
          borderRadius: "0.5rem",
        },
      }}
    >
      <Accordion variant="separated" defaultValue={openChecklist}>
        {items}
      </Accordion>
      <div className="flex w-full justify-between pt-4">
        <Button color={tailwindColors.red[600]}>Delete a Checklist</Button>
        <Button
          color={tailwindColors.green[600]}
          onClick={() => {
            preFlightChecklistItems.push({ name: "test", value: [] })
            setPreFlightChecklistItems(preFlightChecklistItems)
          }}
        >
          Add a new Checklist
        </Button>
      </div>
    </Modal>
  )
}
