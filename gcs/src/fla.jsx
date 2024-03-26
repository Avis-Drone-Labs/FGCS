import {
  Accordion,
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Layout from './components/layout'

import { useEffect, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import Graph from './components/fla/graph'
import {
  showErrorNotification,
  showSuccessNotification,
} from './notification.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Preset categories for filtering
const presetCategories = [
  {
    name: 'Speed',
    filters: [
      {name: 'Ground speed vs Air Speed', filters: {"GPS": ["Spd"], "ARSP": ["Airspeed"]}}
    ],
  },
  {
    name: 'Attitude',
    filters: [
      { name: 'Achieved Roll and Pitch', filters: {"ATT": ["Roll", "Pitch"]} },
      { name: 'Desired Roll vs Achieved Roll', filters: {"ATT": ["DesRoll", "Roll"]} },
      { name: 'Desired Pitch vs Achieved Pitch', filters: {"ATT": ["DesPitch", "Pitch"]} },
    ],
  },
]
const ignoredKeys = ["TimeUS", "function", "source", "result"]

export default function FLA() {
  // States and disclosures used in react frontend
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false)
  const [file, setFile] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [logMessages, setLogMessages] = useState(null)
  const [chartData, setChartData] = useState({ datasets: [] })
  const [messageFilters, setMessageFilters] = useState(null)

  // Load file, if set, and show the graph
  async function loadFile() {
    if (file != null) {
      setLoadingFile(true)
      const result = await window.ipcRenderer.loadFile(file.path)

      if (result.success) {
        // Load messages into states
        const loadedLogMessages = result.messages
        console.log(loadedLogMessages)
        setLogMessages(loadedLogMessages)
        setLoadingFile(false)

        // Set the default state to false for all message filters
        const logMessageFilterDefaultState = {}
        Object.keys(loadedLogMessages['format'])
          .sort()
          .forEach((key) => {
            if (Object.keys(loadedLogMessages).includes(key)) {
              const fieldsState = {}
              loadedLogMessages['format'][key].fields.map(
                (field) => {if (!ignoredKeys.includes(field)) {(fieldsState[field] = false)}},
              )
              logMessageFilterDefaultState[key] = fieldsState
            }
          })

        setMessageFilters(logMessageFilterDefaultState)

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

  // Turn on/off all filters
  function clearFilters() {
    let newFilters = { ...messageFilters }
    Object.keys(newFilters).map((categoryName) => {
      const category = newFilters[categoryName]
      Object.keys(category).map((fieldName) => {
        newFilters[categoryName][fieldName] = false
      })
    })
    setMessageFilters(newFilters)
  }

  useEffect(() => {
    if (!messageFilters) return

    const datasets = []

    // Update the datasets based on the message filters
    Object.keys(messageFilters).map((categoryName) => {
      const category = messageFilters[categoryName]
      Object.keys(category).map((fieldName) => {
        if (category[fieldName]) {
          datasets.push({
            label: `${categoryName}/${fieldName}`,
            data: logMessages[categoryName].map((d) => ({
              x: d.TimeUS,
              y: d[fieldName],
            })),
          })
        }
      })
    })

    setChartData({ datasets: datasets })
  }, [messageFilters])

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
                disabled={!file}
                loading={loadingFile}
              >
                Analyse
              </Button>
            </Group>
          </Modal>
          <div className='flex flex-col w-max pl-10'>
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
        <div className='flex gap-4 flex-cols h-3/4'>
          {/* Message selection column */}
          <div className='flex-none basis-1/4'>
            <ScrollArea className='h-full max-h-max'>
              <Accordion multiple={true}>
                {/* Presets */}
                <Accordion.Item key='presets' value='presets'>
                  <Accordion.Control>Presets</Accordion.Control>
                  <Accordion.Panel>
                    <Accordion multiple={true}>
                      {presetCategories.map((category) => {
                        return (
                          <Accordion.Item
                            key={category.name}
                            value={category.name}
                          >
                            <Accordion.Control>
                              {category.name}
                            </Accordion.Control>
                            <Accordion.Panel>
                            {category.filters.map((filter, idx) => {
                              return (
                                <div className="pb-2">
                                  <Button
                                    key={idx}
                                    onClick={() => {
                                      clearFilters()
                                      let newFilters = { ...messageFilters }
                                      Object.keys(filter.filters).map((categoryName) => {
                                        if (Object.keys(messageFilters).includes(categoryName)) {
                                          filter.filters[categoryName].map((field) => {
                                            newFilters[categoryName][field] = true
                                          })
                                        } else {
                                          showErrorNotification(`Your log file does not include ${categoryName}`)
                                        }
                                      })
                                      setMessageFilters(newFilters)
                                    }}
                                  >
                                    {filter.name}
                                  </Button>
                                </div>
                              )
                            })}
                            </Accordion.Panel>
                          </Accordion.Item>
                        )
                      })}
                    </Accordion>
                  </Accordion.Panel>
                </Accordion.Item>

                {/* All messages */}
                <Accordion.Item key='messages' value='messages'>
                  <Accordion.Control>Messages</Accordion.Control>
                  <Accordion.Panel>
                    <Accordion multiple={false}>
                      {Object.keys(messageFilters).map((messageName, idx) => {
                        return (
                          <Accordion.Item key={idx} value={messageName}>
                            <Accordion.Control>{messageName}</Accordion.Control>
                            <Accordion.Panel>
                              {Object.keys(messageFilters[messageName]).map(
                                (fieldName, idx) => {
                                  return (
                                    <Checkbox
                                      key={idx}
                                      label={fieldName}
                                      checked={
                                        messageFilters[messageName][fieldName]
                                      }
                                      onChange={(event) => {
                                        let newFilters = { ...messageFilters }
                                        newFilters[messageName][fieldName] =
                                          event.currentTarget.checked
                                        setMessageFilters(newFilters)
                                      }}
                                    />
                                  )
                                },
                              )}
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
          <div className='basis-3/4 pr-4'>
            <Graph data={chartData} />
          </div>
        </div>
      )}
    </Layout>
  )
}
