/*
    The Modal component for connecting to the Com Port
    Accessed through the connect button on the navbar
*/

// Third party imports
import { Checkbox, LoadingOverlay, Modal, Grid, Tooltip } from '@mantine/core'

export default function DashboardDataModal({
  opened,
  close,
  possibleData,
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
      {!possibleData && (
        <div>
          <LoadingOverlay visible={true} />
          <p className='text-center mt-10'>Fetching data...</p>
        </div>
      )}
      <Grid>
        {Object.entries(possibleData).map(([key, value], index) => (
          <Grid.Col span={12} key={index}>
            <h3 className='mb-2'>{key}</h3>
            <Grid>
              {Object.entries(value).map(([subkey, subvalue]) => (
                <Grid.Col span={2} key={subkey}>
                  <Tooltip label={subvalue} withArrow>
                    <Checkbox
                      label={subkey}
                      id={`checkbox-${key}-${subkey}`}
                      checked={
                        selectedBox?.currently_selected ===
                          `${key}.${subkey}` || false
                      }
                      onChange={(e) =>
                        handleCheckboxChange(
                          key,
                          subkey,
                          subvalue,
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
