import { Button, FileInput, Group, Modal } from '@mantine/core'
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
  const [isModalOpen, { open: openModal, close: closeModal }] =
    useDisclosure(false)
  const [file, setFile] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [logMessages, setLogMessages] = useState(null)

  async function loadFile() {
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
          <div className="flex-none w-48">
            <Button className="w-full" variant="filled" color={tailwindColors.green[600]}>Option 1</Button>
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
