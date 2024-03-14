import { useDisclosure } from '@mantine/hooks'
import Layout from './components/layout'
import { Button, Modal, FileInput, Group } from '@mantine/core'

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import { useState } from 'react'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function FLA() {
  const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [file, setFile] = useState(null)

  function loadFile() {
    if (file != null) {
      console.log(file)
      closeModal()
    }
  }

  return (
    <Layout currentPage='fla'>
      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        title="Open Log File"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3
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
            data-autofocus
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
    </Layout>
  )
}
