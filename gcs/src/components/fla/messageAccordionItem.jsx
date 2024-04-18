import { Accordion, Checkbox } from '@mantine/core'

export default function MessageAccordionItem({
  messageName,
  logMessageDescriptions,
  messageFilters,
  selectMessageFilterFunc,
}) {
  return (
    <Accordion.Item value={messageName}>
      <Accordion.Control>
        <p>{messageName}</p>
        <p className='text-gray-500 italic text-sm'>
          {logMessageDescriptions[messageName]}
        </p>
      </Accordion.Control>
      <Accordion.Panel>
        <div className='flex flex-col gap-1'>
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
