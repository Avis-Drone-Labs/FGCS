/*
  The card for each log message, this includes all the checkboxes that control whether or
  not they show on the graph. This also contains the descriptions of all log messages from helpers.
*/

// 3rd Party Imports
import { Accordion, Checkbox } from "@mantine/core"

// Helper imports
import { logMessageDescriptions } from "../../helpers/logMessageDescriptions.js"

export default function MessageAccordionItem({
  messageName,
  messageFilters,
  selectMessageFilterFunc,
}) {
  return (
    <Accordion.Item value={messageName}>
      <Accordion.Control className="rounded-md">
        <p>{messageName}</p>
        <p className="text-sm italic text-gray-500">
          {logMessageDescriptions[messageName]}
        </p>
      </Accordion.Control>
      <Accordion.Panel>
        <div className="flex flex-col gap-1">
          {Object.keys(messageFilters[messageName]).map((fieldName, idx) => {
            return (
              <Checkbox
                key={idx}
                label={fieldName}
                checked={messageFilters[messageName][fieldName]}
                onChange={(event) =>
                  selectMessageFilterFunc(event, messageName, fieldName)
                }
              />
            )
          })}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
