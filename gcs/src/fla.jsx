import { Button, FileInput, Group, Modal, Accordion } from '@mantine/core'
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

export default function FLA() {
  // States and disclosures used in react frontend
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false)
  const [file, setFile] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [logMessages, setLogMessages] = useState(null)

  // Preset categories for filtering
  // const presetCategories = {
  //   "Speed": {
  //     "Ground Speed vs Air Speed": ["ground", "air"],
  //     "Ground Speed": ["ground"]
  //   },
  //   "Attitude": {
  //     "Roll and Pitch": ["roll", "pitch"]
  //   }
  // }
  const presetCategories = [
    {name: "Speed", filters: [
      {name: "Ground speed vs Air Speed", filters: ["ground", "air"]}
    ]},
    {name: "Attitude", filters: [
      {name: "Roll and Pitch", filters: ["roll", "pitch"]}
    ]}
  ]

  // Load file, if set, and show the graph
  async function loadFile() {
    console.log(file)
    if (file != null) {
      setLoadingFile(true)
      const result = await window.ipcRenderer.loadFile(file.path)
      if (!result.success) {
        showErrorNotification(result.error)
        setLoadingFile(false)
      } else {
        const loadedLogMessages = result.messages
        console.log(loadedLogMessages)
        setLogMessages(loadedLogMessages)
        setLoadingFile(false)
        showSuccessNotification(`${file.name} loaded successfully`)
        closeModal()
      }
    }
  }

  useEffect(() => {}, [])

  return (
    <Layout currentPage='fla'>
      {logMessages === null ? (
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
          <Button
            variant='filled'
            color={tailwindColors.green[600]}
            onClick={openModal}
            data-autofocus
          >
            Open File
          </Button>
        </>
      ) : (
        <div className="flex gap-4 flex-cols">
          {/* Message selection column */}
          <div className="flex-none w-128">
            <Accordion>
              <Accordion.Item key="presets" value="presets">
                <Accordion.Control>Presets</Accordion.Control>
                <Accordion.Panel>
                  {/* {presetCategories.map((category, catIdx) => {
                    console.log(Object.keys(category)[catIdx])
                    let categoryName = Object.keys(category)[catIdx]
                    return <h1>{categoryName}</h1>
                  })} */}
                  <Accordion>
                    {presetCategories.map((category, catIdx) => {
                      console.log(category)
                      return (
                        <Accordion.Item key={category.name} value={category.name}>
                          <Accordion.Control>{category.name}</Accordion.Control>
                          {category.filters.map((filter, filterIdx) => {
                            return <Accordion.Panel><Button>{filter.name}</Button></Accordion.Panel>
                          })}
                        </Accordion.Item>
                      )
                    })}
                  </Accordion>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item key="messages" value="messages">
                <Accordion.Control>Messages</Accordion.Control>
                <Accordion.Panel>TO ADD STUFF HERE</Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>

          {/* Graph column */}
          <div className="grow">
            <Graph logMessages={logMessages['ATT']} />
          </div>
        </div>
      )}
    </Layout>
  )
}
