import { Button, FileInput, Group, Modal, Accordion, Checkbox, ScrollArea } from '@mantine/core'
import { useDisclosure, useListState } from '@mantine/hooks'
import Layout from './components/layout'

import { useEffect, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import Graph from './components/fla/graph'
import {
  showErrorNotification,
  showNotification,
  showSuccessNotification,
} from './notification.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function FLA() {
  // States and disclosures used in react frontend
  const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [file, setFile] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [logMessages, setLogMessages] = useState(null)
  const [logMessageList, setLogMessageList] = useState([])
  const [filters, filterHandler] = useListState(["ATT/Roll"])

  // Preset categories for filtering
  const presetCategories = [
    {name: "Speed", filters: [
      {name: "Ground speed vs Air Speed", filters: ["GPS/Spd", "ARSP/Airspeed"]}
    ]},
    {name: "Attitude", filters: [
      {name: "Roll and Pitch", filters: ["ATT/Roll", "ATT/Pitch"]}
    ]}
  ]

  // Update data on graph
  function setGraphFilters(filters) {
    showNotification("Updating filters", "Filters are being changed")
    filterHandler.setState(filters)
  }

  function updateGraphFilter(category, filter, enabled) {
    let filterCategoryCombo = `${category}/${filter}`
    if (enabled && !filters.includes(filterCategoryCombo)) {
      filterHandler.append(filterCategoryCombo)
    } else if (!enabled && filters.includes(filterCategoryCombo)) {
      filterHandler.remove(filters.indexOf(filterCategoryCombo))
    }
  }

  // Get filtered list of all messages
  function getFilteredList() {
    let filteredMessages = {}
    for (let filterIdx = 0; filterIdx < filters.length; filterIdx++) {
      let catName = filters[filterIdx].split("/")[0]
      if (Object.keys(logMessages).includes(catName)) {
        filteredMessages[catName] = logMessages[catName]
      }
    }
    console.log(filters, filteredMessages)
    return filteredMessages
  }

  // Load file, if set, and show the graph
  async function loadFile() {
    if (file != null) {
      setLoadingFile(true)
      const result = await window.ipcRenderer.loadFile(file.path)

      if (result.success) {
        // Load messages into states
        const loadedLogMessages = result.messages
        console.log(loadedLogMessages)
        console.log(loadedLogMessages["format"])
        setLogMessages(loadedLogMessages)
        setLoadingFile(false)

        // Sort format so message categories are in alphabetical order
        let format = {}
        Object.keys(loadedLogMessages["format"]).sort().forEach(key => {
          format[key] = loadedLogMessages["format"][key]
        })
        
        // Loop over each category in format and add it to logMessageList
        let logMessageList = []
        for (let categoryIdx = 0; categoryIdx < Object.keys(format).length; categoryIdx++) {
          let categoryName = Object.keys(format)[categoryIdx]
          let category = format[categoryName]
          let categoryFields = []

          // Ignore formate message
          if (categoryName == "FMT")
            continue

          // Add all category fields to log messages
          for (let fieldIdx = 0; fieldIdx < category.fields.length; fieldIdx++) {
            categoryFields.push({"name": category.fields[fieldIdx]})
          }
          logMessageList.push({"name": categoryName, "fields": categoryFields})
        }
        setLogMessageList(logMessageList)

        // Close modal and show success message
        showSuccessNotification(`${file.name} loaded successfully`)
        closeModal()
      } else {
        // Error
        showErrorNotification(result.error)
        setLoadingFile(false)
      }
    }
  }

  useEffect(() => {}, [])

  return (
    <Layout currentPage='fla'>
      {logMessages === null ? (
        // Open flight logs section
        <>
          <Modal
            opened={isModalOpen}
            onClose={closeModal}
            title='Open Log File'
            centered
            overlayProps={{
              backgroundOpacity: 0.55,
              blur: 3,
            }}
            withCloseButton={false}
          >
            <FileInput
              variant='filled'
              label='File Location'
              description='Select a file to analyse'
              placeholder='file.log'
              onChange={setFile}
              clearable
              accept='.log'
            />

            <Group justify='space-between' className='pt-4'>
              <Button
                variant='filled'
                color={tailwindColors.red[600]}
                onClick={closeModal}
              >
                Close
              </Button>
              <Button
                variant='filled'
                color={tailwindColors.green[600]}
                onClick={loadFile}
                loading={loadingFile}
              >
                Analyse
              </Button>
            </Group>
          </Modal>
          <div className="flex flex-col w-max pl-10">
            No file loaded
            <Button
              variant='filled'
              color={tailwindColors.green[600]}
              onClick={openModal}
              data-autofocus
            >
              Open File
            </Button>
          </div>
        </>
      ) : (
        
        // Graphs section
        <div className="flex gap-4 flex-cols h-3/4">
          {/* Message selection column */}
          <div className="flex-none basis-1/4">
            <ScrollArea className="h-full max-h-max">
              <Accordion multiple={true}>
                {/* Presets */}
                <Accordion.Item key="presets" value="presets">
                  <Accordion.Control>Presets</Accordion.Control>
                  <Accordion.Panel>
                    <Accordion multiple={true}>
                      {presetCategories.map((category, _) => {
                        return (
                          <Accordion.Item key={category.name} value={category.name}>
                            <Accordion.Control>{category.name}</Accordion.Control>
                            {category.filters.map((filter, _) => {
                              return <Accordion.Panel><Button onClick={() => {setGraphFilters(filter.filters)}}>{filter.name}</Button></Accordion.Panel>
                            })}
                          </Accordion.Item>
                        )
                      })}
                    </Accordion>
                  </Accordion.Panel>
                </Accordion.Item>

                {/* All messages */}
                <Accordion.Item key="messages" value="messages">
                  <Accordion.Control>Messages</Accordion.Control>
                  <Accordion.Panel>
                    <Accordion multiple={false}>
                      {logMessageList.map((category, _) => {
                        return (
                          <Accordion.Item key={category.name} value={category.name}>
                            <Accordion.Control><Checkbox label={category.name} /></Accordion.Control>
                            <Accordion.Panel>
                              {category.fields.map((field, _) => {
                                return <Checkbox label={field.name} className="pb-1" onClick={(event) => {updateGraphFilter(category.name, field.name, event.currentTarget.checked)}} />
                              })}
                            </Accordion.Panel>
                          </Accordion.Item>
                        )
                      })}
                    </Accordion>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </ScrollArea>
          </div>

          {/* Graph column */}
          <div className="basis-3/4 pr-4">
            <Graph logMessages={logMessages} filters={filters} />
          </div>
        </div>
      )}
    </Layout>
  )
}
