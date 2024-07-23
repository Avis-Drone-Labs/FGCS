/*
    The Modal component for connecting to the Com Port
    Accessed through the connect button on the navbar
*/

// Third party imports
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
  
  // Styling imports
  import resolveConfig from 'tailwindcss/resolveConfig'
  import tailwindConfig from '../../tailwind.config.js'
  
  const tailwindColors = resolveConfig(tailwindConfig).theme.colors
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7'];
  
  export default function DashboardDataModal({
    opened,
    close,
    possibleData,
  }) {
    return (
      <Modal
        opened={opened}
        onClose={() => {
          close()
        }}
        title='Select Data'
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        {/* <LoadingOverlay visible={fetchingComPorts} /> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                <input type="checkbox" id={`checkbox-${index}`} className="mr-2" />
                <label htmlFor={`checkbox-${index}`}>{item}</label>
                </div>
            ))}
        </div>
        <Group justify='space-between' className='pt-4'>
          <Button
            variant='filled'
            color={tailwindColors.red[600]}
            onClick={() => {
              close()
            }}
          >
            Close
          </Button>
          <Button
            variant='filled'
            color={tailwindColors.green[600]}
            onClick={() => close()}
            data-autofocus
          >
            Confirm
          </Button>
        </Group>
      </Modal>
    )
  }
  