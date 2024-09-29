/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this
  is where it is loaded. This also handles the connections to the drone as this is always loaded,
  in the future we may change this so that its loaded in its own component.
*/

// Base imports
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Third party imports
import {
  Button,
  Checkbox,
  Group,
  LoadingOverlay,
  Modal,
  SegmentedControl,
  Select,
  Tabs,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  useDisclosure,
  useInterval,
  useLocalStorage,
  useSessionStorage,
} from '@mantine/hooks'
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'

// Styling imports
import { twMerge } from 'tailwind-merge'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

// Helper imports
import { IconAlertTriangle } from '@tabler/icons-react'
import { showErrorNotification } from '../helpers/notification.js'
import { socket } from '../helpers/socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {
  // Panel is open/closed
  const [opened, { open, close }] = useDisclosure(false)

  const [outOfDate] = useSessionStorage({ key: 'outOfDate' })

  // Connection to drone
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [wireless, setWireless] = useLocalStorage({
    key: 'wirelessConnection',
    defaultValue: true,
  })
  const [connectedToSocket, setConnectedToSocket] = useSessionStorage({
    key: 'socketConnection',
    defaultValue: false,
  })
  const checkIfConnectedToSocket = useInterval(
    () => setConnectedToSocket(socket.connected),
    3000,
  )
  const [selectedBaudRate, setSelectedBaudRate] = useLocalStorage({
    key: 'baudrate',
    defaultValue: '9600',
  })

  // eslint-disable-next-line no-unused-vars
  const [aircraftType, setAircraftType] = useLocalStorage({
    key: 'aircraftType',
    defaultValue: 0,
  })

  const [connectionType, setConnectionType] = useState('serial')

  // Com Ports
  const [comPorts, setComPorts] = useState([])
  const [selectedComPort, setSelectedComPort] = useState(null)
  const [fetchingComPorts, setFetchingComPorts] = useState(false)

  // Network Connection
  const [networkType, setNetworkType] = useSessionStorage({
    key: 'networkType',
    defaultValue: 'tcp',
  })
  const [ip, setIp] = useSessionStorage({
    key: 'ip',
    defaultValue: '127.0.0.1',
  })
  const [port, setPort] = useSessionStorage({
    key: 'port',
    defaultValue: '5760',
  })

  const [droneConnectionStatusMessage, setDroneConnectionStatusMessage] =
    useState(null)

  function getComPorts() {
    if (!connectedToSocket) return
    socket.emit('get_com_ports')
    setFetchingComPorts(true)
  }

  // Check if connected to drone
  useEffect(() => {
    checkIfConnectedToSocket.start()

    if (selectedComPort === null) {
      socket.emit('is_connected_to_drone')
    }

    // Flag connected/not connected, if not fetch ports
    socket.on('is_connected_to_drone', (msg) => {
      if (msg) {
        setConnected(true)
      } else {
        setConnected(false)
        setConnecting(false)
        getComPorts()
      }
    })

    // Fetch com ports and list them
    socket.on('list_com_ports', (msg) => {
      setFetchingComPorts(false)
      setComPorts(msg)
      const possibleComPort = msg.find(
        (port) =>
          port.toLowerCase().includes('mavlink') ||
          port.toLowerCase().includes('ardupilot'),
      )
      if (possibleComPort !== undefined) {
        setSelectedComPort(possibleComPort)
      } else if (msg.length > 0) {
        setSelectedComPort(msg[0])
      }
    })

    // Flags that the drone is connected
    socket.on('connected_to_drone', (data) => {
      setAircraftType(data.aircraft_type)
      if (data.aircraft_type != 1 && data.aircraft_type != 2) {
        showErrorNotification('Aircraft not of type quadcopter or plane')
      }
      setConnected(true)
      setConnecting(false)
      close()
    })

    // Flags that the drone is disconnected
    socket.on('disconnected_from_drone', () => {
      console.log('disconnected_from_drone')
      setConnected(false)
    })

    // Handles disconnect trigger
    socket.on('disconnect', () => {
      setConnected(false)
      setConnecting(false)
    })

    // Flags an error with the com port
    socket.on('connection_error', (msg) => {
      console.log(msg.message)
      showErrorNotification(msg.message)
      setConnecting(false)
      setConnected(false)
    })

    socket.on('drone_connect_status', (msg) => {
      setDroneConnectionStatusMessage(msg.message)
    })

    return () => {
      checkIfConnectedToSocket.stop()
      socket.off('is_connected_to_drone')
      socket.off('list_com_ports')
      socket.off('connected_to_drone')
      socket.off('disconnected_from_drone')
      socket.off('disconnect')
      socket.off('connection_error')
      socket.off('drone_connect_status')
      setConnected(false)
    }
  }, [])

  function connectToDrone(type) {
    if (type === 'serial') {
      socket.emit('connect_to_drone', {
        port: selectedComPort,
        baud: parseInt(selectedBaudRate),
        wireless: wireless,
        connectionType: 'serial',
      })
    } else if (type === 'network') {
      if (ip === '' || port === '') {
        showErrorNotification('IP Address and Port cannot be empty')
        return
      }
      const networkString = `${networkType}:${ip}:${port}`
      socket.emit('connect_to_drone', {
        port: networkString,
        baud: 115200,
        wireless: true,
        connectionType: 'network',
      })
    } else {
      return
    }
    setConnecting(true)
  }

  function disconnect() {
    console.log('disconnect')
    socket.emit('disconnect_from_drone')
  }

  const linkClassName =
    'text-md px-2 rounded-sm outline-none focus:text-falconred-400 hover:text-falconred-400 transition-colors delay-50'

  return (
    <div className='flex flex-row items-center justify-center py-2 px-2 bg-falcongrey-900'>
      <Modal
        opened={opened}
        onClose={() => {
          close()
          setConnecting(false)
        }}
        title='Connect to aircraft'
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
        styles={{
          content: {
            borderRadius: '0.5rem',
          },
        }}
      >
        <Tabs value={connectionType} onChange={setConnectionType}>
          <Tabs.List grow>
            <Tabs.Tab value='serial'>Serial Connection</Tabs.Tab>
            <Tabs.Tab value='network'>Network Connection</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value='serial' className='py-4'>
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
          </Tabs.Panel>
          <Tabs.Panel value='network' className='py-4'>
            <div className='flex flex-col space-y-4'>
              <SegmentedControl
                label='Network Connection type'
                description='Select a network connection type'
                value={networkType}
                onChange={setNetworkType}
                data={[
                  { value: 'tcp', label: 'TCP' },
                  { value: 'udp', label: 'UDP' },
                ]}
              />
              <TextInput
                label='IP Address'
                description='Enter the IP Address'
                placeholder='127.0.0.1'
                value={ip}
                onChange={(event) => setIp(event.currentTarget.value)}
              />
              <TextInput
                label='Port'
                description='Enter the port number'
                placeholder='5760'
                value={port}
                onChange={(event) => setPort(event.currentTarget.value)}
              />
            </div>
          </Tabs.Panel>
        </Tabs>

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
            onClick={() => connectToDrone(connectionType)}
            data-autofocus
            disabled={!connectedToSocket || selectedComPort === null}
            loading={connecting}
          >
            Connect
          </Button>
        </Group>

        {connecting && droneConnectionStatusMessage !== null && (
          <p className='text-center mt-4'>{droneConnectionStatusMessage}</p>
        )}
      </Modal>

      <Link
        to='/'
        className={twMerge(
          linkClassName,
          currentPage === 'dashboard' && 'text-falconred font-bold',
        )}
      >
        Dashboard
      </Link>
      <Link
        to='/graphs'
        className={twMerge(
          linkClassName,
          currentPage === 'graphs' && 'text-falconred font-bold',
        )}
      >
        Graphs
      </Link>
      <Link
        to='/params'
        className={twMerge(
          linkClassName,
          currentPage === 'params' && 'text-falconred font-bold',
        )}
      >
        Params
      </Link>
      <Link
        to='/config'
        className={twMerge(
          linkClassName,
          currentPage === 'config' && 'text-falconred font-bold',
        )}
      >
        Config
      </Link>
      <Link
        to='/fla'
        className={twMerge(
          linkClassName,
          currentPage === 'fla' && 'text-falconred font-bold',
        )}
      >
        FLA
      </Link>

      <div className='!ml-auto flex flex-row space-x-4 items-center'>
        {outOfDate && (
          <a
            href='https://github.com/Avis-Drone-Labs/FGCS/releases'
            target='_blank'
            className='flex flex-row gap-2 text-red-400 hover:text-red-600'
          >
            <IconAlertTriangle /> FGCS out of date
          </a>
        )}
        <p>
          {connected && (
            <>
              {connectionType === 'serial'
                ? selectedComPort
                : `${networkType}:${ip}:${port}`}
            </>
          )}
        </p>
        {connectedToSocket ? (
          <Button
            onClick={
              connected
                ? disconnect
                : () => {
                    getComPorts()
                    open()
                  }
            }
            color={
              connected ? tailwindColors.red[600] : tailwindColors.green[600]
            }
          >
            {connected ? 'Disconnect' : 'Connect'}
          </Button>
        ) : (
          <Tooltip label='Not connected to socket'>
            <Button data-disabled onClick={(event) => event.preventDefault()}>
              Connect
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
