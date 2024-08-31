/*
    The Modal component for connecting to the Com Port
    Accessed through the connect button on the navbar
*/

// Third party imports
import { Checkbox, Grid, LoadingOverlay, Modal, Tooltip } from '@mantine/core'
import { mavlinkMsgParams } from '../helpers/mavllinkDataStreams.js'
export default function DashboardDataModal({
  opened,
  close,
  selectedBox,
  handleCheckboxChange,
}) {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        close()
      }}
      size={'100%'}
      title='Select Data'
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      {/* Loading overlay should be hidden when all possible data is collected */}
      {!mavlinkMsgParams && (
        <div>
          <LoadingOverlay visible={true} />
          <p className='text-center mt-10'>Fetching data...</p>
        </div>
      )}
      <Grid>
        {Object.entries(mavlinkMsgParams).map(([key, value], index) => (
          <Grid.Col span={12} key={index}>
            <h3 className='mb-2'>{key}</h3>
            <Grid>
              {Object.entries(value).map(([dataKey, dataLabel]) => (
                <Grid.Col span={2} key={dataKey}>
                  <Tooltip label={dataLabel} withArrow>
                    <Checkbox
                      label={dataKey}
                      id={`checkbox-${key}-${dataKey}`}
                      checked={
                        selectedBox?.currently_selected ===
                          `${key}.${dataKey}` || false
                      }
                      onChange={(e) =>
                        handleCheckboxChange(
                          key,
                          dataKey,
                          dataLabel,
                          selectedBox?.boxId,
                          e.target.checked,
                        )
                      }
                    />
                  </Tooltip>
                </Grid.Col>
              ))}
            </Grid>
          </Grid.Col>
        ))}
      </Grid>
    </Modal>
  )
}
