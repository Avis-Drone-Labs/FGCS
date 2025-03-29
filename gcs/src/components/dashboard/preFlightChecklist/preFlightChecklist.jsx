/*
  Preflight checklist modal, a popup that allows the user to tick off things for their flight
*/

import { Modal, Checkbox, Accordion } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import CheckListArea from "./checkListArea";

const preFlightChecklistItems = [
  {
    name: "BMFA Buckminster",
    value:
      [
        {"checked": false, "name": "Item 1"},
        {"checked": false, "name": "Item 2"},
        {"checked": false, "name": "Item 3"},
        {"checked": false, "name": "Item 4"},
      ]
  },
  {
    name: "SUAS Test 1",
    value:
      [
        {"checked": false, "name": "Go to America"},
        {"checked": true, "name": "Build Drone"},
        {"checked": false, "name": "Fly Drone"},
      ]
    },
    {
      name: "FGCS <3",
      value:
      [
        {"checked": true, "name": "Download FGCS"},
        {"checked": true, "name": "Talk about how good it is"},
        {"checked": true, "name": "Preach"},
      ]
  },
];

export default function PreFlightChecklist({showModal, setShowModal}) {
  const items = preFlightChecklistItems.map((item) => (
    <Accordion.Item key={item.name} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <CheckListArea items={item.value} />
      </Accordion.Panel>
    </Accordion.Item>
  ));

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
      <Accordion variant="separated">
        {items}
      </Accordion>
    </Modal>
  )
}