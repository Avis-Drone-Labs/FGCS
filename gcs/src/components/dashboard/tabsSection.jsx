/* 
  Tabs section. This will be a part of the resizable info box located in the bottom half. This
  contains tabs like data, action, missions, and camera.
*/

// Native Imports
import { useState, useCallback, useEffect } from 'react'

// 3rd Party Imports
import { Tabs, Button, Grid, NumberInput, Popover, Select } from '@mantine/core'
import {
  useDisclosure,
  useLocalStorage,
  useSessionStorage,
} from '@mantine/hooks'
import { IconInfoCircle } from '@tabler/icons-react'
import Webcam from 'react-webcam'

// Custom Components
import DashboardDataModal from '../dashboardDataModal'

// Helper Javascript Files
import { socket } from '../../helpers/socket'
import { DataMessage } from '../../helpers/dataDisplay'
import {
  MISSION_STATES,
  COPTER_MODES_FLIGHT_MODE_MAP,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from '../../helpers/mavlinkConstants'

export default function TabsSection({
  connected,
  aircraftType,
  getIsArmed,
  currentFlightModeNumber,
  currentMissionData,
  navControllerOutputData,
  displayedData,
  setDisplayedData,
}) {
  const [selectedBox, setSelectedBox] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [newFlightModeNumber, setNewFlightModeNumber] = useState(3) // Default to AUTO mode

  const [takeoffAltitude, setTakeoffAltitude] = useLocalStorage({
    key: 'takeoffAltitude',
    defaultValue: 10,
  })

  const handleDoubleClick = (box) => {
    setSelectedBox(box)
    open()
  }

  const handleCheckboxChange = (key, subkey, subvalue, boxId, isChecked) => {
    // Update wantedData on checkbox change
    if (isChecked) {
      const newDisplay = displayedData.map((item, index) => {
        if (index === boxId) {
          return {
            ...item,
            currently_selected: `${key}.${subkey}`,
            display_name: subvalue,
          }
        }
        return item
      })
      setDisplayedData(newDisplay)
      close()
    }
  }

  // Camera devices
  const [deviceId, setDeviceId] = useSessionStorage({
    key: 'deviceId',
    defaultValue: null,
  })
  const [devices, setDevices] = useState([])

  const handleDevices = useCallback(
    (mediaDevices) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices],
  )

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices)
  }, [handleDevices])

  function getFlightModeMap() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP
    }

    return {}
  }

  function armDisarm(arm, force = false) {
    // TODO: Add force arm ability
    socket.emit('arm_disarm', { arm: arm, force: force })
  }

  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    socket.emit('set_current_flight_mode', { newFlightMode: modeNumber })
  }

  function controlMission(action) {
    socket.emit('control_mission', { action })
  }

  function takeoff() {
    socket.emit('takeoff', { alt: takeoffAltitude })
  }

  function land() {
    socket.emit('land')
  }

  return (
    <Tabs defaultValue='data'>
      <Tabs.List grow>
        <Tabs.Tab value='data'>Data</Tabs.Tab>
        <Tabs.Tab value='actions'>Actions</Tabs.Tab>
        <Tabs.Tab value='mission'>Mission</Tabs.Tab>
        <Tabs.Tab value='camera'>Camera</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value='data'>
        <>
          <Grid className='cursor-pointer select-none mt-2'>
            {displayedData.length > 0 ? (
              displayedData.map((data) => (
                <Grid.Col
                  span={6}
                  key={data.boxId}
                  onDoubleClick={() => handleDoubleClick(data)} // Pass boxId to the function
                >
                  <DataMessage
                    label={data.display_name}
                    value={data.value}
                    currentlySelected={data.currently_selected}
                    id={data.boxId}
                  />
                </Grid.Col>
              ))
            ) : (
              <div className='flex justify-center items-center p-4'>
                <IconInfoCircle size={20} />
                <p className='ml-2'>Double Click to select data</p>
              </div>
            )}
          </Grid>
          <DashboardDataModal
            opened={opened}
            close={close}
            selectedBox={selectedBox}
            handleCheckboxChange={handleCheckboxChange}
          />
        </>
      </Tabs.Panel>

      <Tabs.Panel value='actions'>
        {/* Arming/Flight Modes */}
        {!connected ? (
          <div className='flex flex-col items-center justify-center h-full'>
            <p className='text-white-800 p-6 text-center'>
              No actions are available right now. Connect a drone to begin
            </p>
          </div>
        ) : (
          <div className='flex flex-col flex-wrap gap-4 mt-4'>
            <div className='flex flex-row space-x-14'>
              <Button
                onClick={() => {
                  armDisarm(!getIsArmed())
                }}
              >
                {getIsArmed() ? 'Disarm' : 'Arm'}
              </Button>
            </div>
            <div className='flex flex-row space-x-2'>
              {currentFlightModeNumber !== null && (
                <>
                  <Select
                    value={newFlightModeNumber.toString()}
                    onChange={(value) => {
                      setNewFlightModeNumber(parseInt(value))
                    }}
                    data={Object.keys(getFlightModeMap()).map((key) => {
                      return {
                        value: key,
                        label: getFlightModeMap()[key],
                      }
                    })}
                  />
                  <Button onClick={() => setNewFlightMode(newFlightModeNumber)}>
                    Set flight mode
                  </Button>
                </>
              )}
            </div>
            <div className='flex flex-row space-x-2'>
              <Popover width={200} position='bottom' withArrow shadow='md'>
                <Popover.Target>
                  <Button>Takeoff</Button>
                </Popover.Target>
                <Popover.Dropdown className='flex flex-col space-y-2'>
                  <NumberInput
                    label='Takeoff altitude (m)'
                    placeholder='Takeoff altitude (m)'
                    value={takeoffAltitude}
                    onChange={setTakeoffAltitude}
                    min={0}
                    allowNegative={false}
                    hideControls
                  />
                  <Button
                    onClick={() => {
                      takeoff()
                    }}
                  >
                    Takeoff
                  </Button>
                </Popover.Dropdown>
              </Popover>
              <Button
                onClick={() => {
                  land()
                }}
              >
                Land
              </Button>
            </div>
          </div>
        )}
      </Tabs.Panel>

      <Tabs.Panel value='mission'>
        {!connected ? (
          <div className='flex flex-col items-center justify-center h-full'>
            <p className='text-white-800 p-6 text-center'>
              No mission actions are available right now. Connect a drone to
              begin
            </p>
          </div>
        ) : (
          <div className='flex flex-col flex-wrap gap-4 mt-4'>
            <div className='flex flex-col text-xl'>
              <p>
                Mission state:{' '}
                {MISSION_STATES[currentMissionData.mission_state]}
              </p>
              <p>
                Waypoint: {currentMissionData.seq}/{currentMissionData.total}
              </p>
              <p>
                Distance to WP:{' '}
                {(navControllerOutputData.wp_dist
                  ? navControllerOutputData.wp_dist
                  : 0
                ).toFixed(2)}
                m
              </p>
            </div>
            <div className='flex flex-row space-x-14'>
              <Button
                onClick={() => {
                  setNewFlightMode(
                    parseInt(
                      Object.keys(getFlightModeMap()).find(
                        (key) => getFlightModeMap()[key] === 'Auto',
                      ),
                    ),
                  )
                }}
              >
                Auto mode
              </Button>
            </div>
            <div className='flex flex-row space-x-14'>
              <Button
                onClick={() => {
                  controlMission('start')
                }}
              >
                Start mission
              </Button>
            </div>
            <div className='flex flex-row space-x-14'>
              <Button
                onClick={() => {
                  controlMission('restart')
                }}
              >
                Restart mission
              </Button>
            </div>
          </div>
        )}
      </Tabs.Panel>

      <Tabs.Panel value='camera'>
        <div className='flex flex-col gap-4 mt-2'>
          <Select
            label='Select camera input'
            data={devices.map((device) => {
              return { value: device.deviceId, label: device.label }
            })}
            value={deviceId}
            onChange={setDeviceId}
          />
          {deviceId !== null && (
            <Webcam audio={false} videoConstraints={{ deviceId: deviceId }} />
          )}
        </div>
      </Tabs.Panel>
    </Tabs>
  )
}
