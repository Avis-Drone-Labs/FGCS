
import { Button, Loader, Modal } from "@mantine/core";

// Styling imports
import tailwindConfig from '../tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function AutopilotRebootModal({rebootData, opened, onClose}){
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Rebooting autopilot'
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className='flex flex-col items-center justify-center'>
        {rebootData.message === undefined ? (
          <Loader />
        ) : (
          <>
          {!rebootData.success && (
            <>
              <p className='my-2'>
                {rebootData.message} You will need to reconnect.
              </p>
              <Button
                onClick={close}
                color={tailwindColors.red[600]}
                className='mt-4'
              >
                Close
              </Button>
            </>
          )}
          </>
        )}
      </div>
    </Modal>
  )
}
