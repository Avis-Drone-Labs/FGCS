/*
    The Modal component for connecting to the Com Port
    Accessed through the connect button on the navbar
*/

// Third party imports
import {
    Button,
    Checkbox,
    Group,
    Modal,
  } from '@mantine/core'
  
  // Styling imports
  import resolveConfig from 'tailwindcss/resolveConfig'
  import tailwindConfig from '../../tailwind.config.js'
  
  const tailwindColors = resolveConfig(tailwindConfig).theme.colors
  
  export default function DashboardDataModal({
    opened,
    close,
    possibleData,
    handleCheckboxChange,
    handleConfirm,
    checkboxStates,
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
        {/* Loading overlay should be hidden when all possible data is collected */}
        {/* <LoadingOverlay visible={fetchingComPorts} /> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {possibleData.map((item, index) => (
            <div key={index} className="flex items-center">
            <Checkbox
            label={item}
            id={`checkbox-${index}`}
            className="mr-2"
            checked={checkboxStates[index] || false}
            onChange={(e) => handleCheckboxChange(index, e.target.checked)}
            />
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
            onClick={() => handleConfirm()}
            data-autofocus
          >
            Confirm
          </Button>
        </Group>
      </Modal>
    )
  }
  