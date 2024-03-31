import {
  Accordion,
  ActionIcon,
  Button,
  Checkbox,
  ColorInput,
  FileButton,
  Progress,
  ScrollArea,
} from '@mantine/core'
import Layout from './components/layout'

import { IconPaint, IconTrash } from '@tabler/icons-react'
import { Fragment, useEffect, useState } from 'react'
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
      {
        name: 'Ground speed vs Air Speed',
        filters: { GPS: ['Spd'], ARSP: ['Airspeed'] },
      },
    ],
  },
  {
    name: 'Attitude',
    filters: [
      { name: 'Achieved Roll and Pitch', filters: { ATT: ['Roll', 'Pitch'] } },
      {
        name: 'Desired Roll vs Achieved Roll',
        filters: { ATT: ['DesRoll', 'Roll'] },
      },
      {
        name: 'Desired Pitch vs Achieved Pitch',
        filters: { ATT: ['DesPitch', 'Pitch'] },
      },
    ],
  },
]
const ignoredKeys = ['TimeUS', 'function', 'source', 'result']

export default function FLA() {
  // States in react frontend
  const [file, setFile] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingFileProgress, setLoadingFileProgress] = useState(0)
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
              loadedLogMessages['format'][key].fields.map((field) => {
                if (!ignoredKeys.includes(field)) {
                  fieldsState[field] = false
                }
              })
              logMessageFilterDefaultState[key] = fieldsState
            }
          })

        setMessageFilters(logMessageFilterDefaultState)

        // Close modal and show success message
        showSuccessNotification(`${file.name} loaded successfully`)
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

  // Turn off only one filter at a time
  function removeDataset(label) {
    let [categoryName, fieldName] = label.split('/')
    let newFilters = { ...messageFilters }
    if (
      newFilters[categoryName] &&
      newFilters[categoryName][fieldName] !== undefined
    ) {
      newFilters[categoryName][fieldName] = false
    }
    setMessageFilters(newFilters)
  }

  function closeLogFile() {
    setFile(null)
    setLoadingFileProgress(0)
    setLogMessages(null)
    setChartData({ datasets: [] })
    setMessageFilters(null)
  }

  useEffect(() => {
    window.ipcRenderer.on('fla:log-parse-progress', function (evt, message) {
      setLoadingFileProgress(message.percent)
    })

    return () => {
      window.ipcRenderer.removeAllListeners(['fla:log-parse-progress'])
    }
  }, [])

  useEffect(() => {
    if (file !== null) {
      loadFile()
    }
  }, [file])

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
        <div className='flex flex-col items-center justify-center h-full w-min mx-auto'>
          <FileButton
            color={tailwindColors.blue[600]}
            variant='filled'
            onChange={setFile}
            accept='.log'
            loading={loadingFile}
          >
            {(props) => <Button {...props}>Analyse a log</Button>}
          </FileButton>
          {loadingFile && (
            <Progress
              value={loadingFileProgress}
              className='w-full my-4'
              color={tailwindColors.green[500]}
            />
          )}
        </div>
      ) : (
        // Graphs section
        <>
          <div className='flex gap-4 h-3/4'>
            {/* Message selection column */}
            <div className='w-1/4 pb-6'>
              <Button
                className='mx-4 my-2'
                size='xs'
                color={tailwindColors.red[500]}
                onClick={closeLogFile}
              >
                Close file
              </Button>
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
                                <div className='flex flex-col gap-2'>
                                  {category.filters.map((filter, idx) => {
                                    return (
                                      <Button
                                        key={idx}
                                        onClick={() => {
                                          clearFilters()
                                          let newFilters = { ...messageFilters }
                                          Object.keys(filter.filters).map(
                                            (categoryName) => {
                                              if (
                                                Object.keys(
                                                  messageFilters,
                                                ).includes(categoryName)
                                              ) {
                                                filter.filters[
                                                  categoryName
                                                ].map((field) => {
                                                  newFilters[categoryName][
                                                    field
                                                  ] = true
                                                })
                                              } else {
                                                showErrorNotification(
                                                  `Your log file does not include ${categoryName}`,
                                                )
                                              }
                                            },
                                          )
                                          setMessageFilters(newFilters)
                                        }}
                                      >
                                        {filter.name}
                                      </Button>
                                    )
                                  })}
                                </div>
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
                              <Accordion.Control>
                                {messageName}
                              </Accordion.Control>
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
            <div className='w-full h-full pr-4'>
              <Graph data={chartData} />
            </div>
          </div>

          {/* Plots Setup */}
          <div className='flex gap-4 pt-6 flex-cols h-1/4'>
            <div className='ml-4'>
              <div className='flex flex-row items-center'>
                <h3 className='mt-2 mb-2 text-xl'>Graph setup</h3>
                {/* Clear Filters */}
                <Button
                  className='ml-6'
                  size='xs'
                  color={tailwindColors.red[500]}
                  onClick={clearFilters}
                >
                  Clear graph
                </Button>
              </div>
              {chartData.datasets.map((item, index) => (
                <Fragment key={index}>
                  <div className='inline-flex items-center px-2 py-2 mr-3 text-xs font-bold text-white border border-gray-700 rounded-lg bg-grey-200 gap-2'>
                    {/* Name */}
                    <span>{item.label}</span>

                    {/* Color Selector */}
                    <ColorInput
                      className='w-32'
                      format='hex'
                      swatches={[
                        '#f5f5f5',
                        '#868e96',
                        '#fa5252',
                        '#e64980',
                        '#be4bdb',
                        '#7950f2',
                        '#4c6ef5',
                        '#228be6',
                        '#15aabf',
                        '#12b886',
                        '#40c057',
                        '#82c91e',
                        '#fab005',
                        '#fd7e14',
                      ]}
                      closeOnColorSwatchClick
                      withEyeDropper={false}
                      rightSection={<IconPaint size={18} />}
                      onChangeEnd={(color) => console.log(color)} // TODO: Add updating colors
                    />
                    {/* Delete button */}
                    <ActionIcon
                      variant='subtle'
                      color={tailwindColors.red[500]}
                      onClick={() => removeDataset(item.label)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
