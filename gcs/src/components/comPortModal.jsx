import {
    Button,
    Checkbox,
    Group,
    LoadingOverlay,
    Modal,
    Select,
    Tooltip,
} from '@mantine/core'

import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function ComPortModal({
    opened,
    comPorts,
    selectedComPort,
    selectedBaudRate,
    wireless,
    fetchingComPorts,
    connecting,
    connectedToSocket,
    saveCOMData,
    setConnecting,
    setSelectedComPort,
    setSelectedBaudRate,
    setWireless,
    close,
    getComPorts
}
) {

    return (
        <Modal
        opened={opened}
        onClose={() => {
          close()
          setConnecting(false)
        }}
        title='Select COM Port'
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <LoadingOverlay visible={fetchingComPorts} />
        <div className='flex flex-col space-y-4'>
          <Select
            label='COM Port'
            description='Select a COM Port from the ones available'
            placeholder={
              comPorts.length ? 'Select a COM port' : 'No COM ports found'
            }
            data={comPorts}
            value={selectedComPort}
            onChange={setSelectedComPort}
            rightSectionPointerEvents='all'
            rightSection={<IconRefresh />}
            rightSectionProps={{
              onClick: getComPorts,
              className: 'hover:cursor-pointer hover:bg-transparent/50',
            }}
          />
          <Select
            label='Baud Rate'
            description='Select a baud rate for the specified COM Port'
            data={[
              '300',
              '1200',
              '4800',
              '9600',
              '19200',
              '13400',
              '38400',
              '57600',
              '74880',
              '115200',
              '230400',
              '250000',
            ]}
            value={selectedBaudRate}
            onChange={setSelectedBaudRate}
          />
          <div className='flex flex-row gap-2'>
            <Checkbox
              label='Wireless Connection'
              checked={wireless}
              onChange={(event) => setWireless(event.currentTarget.checked)}
            />
            <Tooltip label='Wireless connection mode reduces the telemetry data rates to save bandwidth'>
              <IconInfoCircle size={20} />
            </Tooltip>
          </div>
        </div>
        <Group justify='space-between' className='pt-4'>
          <Button
            variant='filled'
            color={tailwindColors.red[600]}
            onClick={() => {
              close()
              setConnecting(false)
            }}
          >
            Close
          </Button>
          <Button
            variant='filled'
            color={tailwindColors.green[600]}
            onClick={saveCOMData}
            data-autofocus
            disabled={!connectedToSocket || selectedComPort === null}
            loading={connecting}
          >
            Connect
          </Button>
        </Group>
      </Modal>
    )
}