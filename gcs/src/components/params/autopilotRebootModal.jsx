/*
    Modal that pops up when rebooting the autopilot using the "Reboot FC" button
*/

// 3rd party imports
import { Button, Loader, Modal } from "@mantine/core"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  selectAutoPilotRebootModalOpen,
  selectRebootData,
  setAutoPilotRebootModalOpen,
} from "../../redux/slices/paramsSlice.js"

export default function AutopilotRebootModal() {
  const dispatch = useDispatch()
  const rebootData = useSelector(selectRebootData)
  const opened = useSelector(selectAutoPilotRebootModalOpen)

  return (
    <Modal
      opened={opened}
      onClose={() => dispatch(setAutoPilotRebootModalOpen(false))}
      title="Rebooting autopilot"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        {rebootData.message === undefined ? (
          <Loader />
        ) : (
          <>
            {!rebootData.success && (
              <>
                <p className="my-2">
                  {rebootData.message} You will need to reconnect.
                </p>
                <Button
                  onClick={() => dispatch(setAutoPilotRebootModalOpen(false))}
                  color={tailwindColors.red[600]}
                  className="mt-4"
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
