/*
    The Modal component for connecting to the Com Port
    Accessed through the connect button on the navbar
*/

// Third party imports
import {
    Button,
    Checkbox,
    LoadingOverlay,
    Group,
    Modal,
    Grid,
    Tooltip
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
    wantedData,
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
        withCloseButton={false}
      >
        {/* Loading overlay should be hidden when all possible data is collected */}
        {!possibleData && (
          <div>
            <LoadingOverlay visible={true} />
            <p className="text-center mt-10">Fetching data...</p>
          </div>
        )}
        <Grid>
          {Object.entries(possibleData).map(([key, value], index) => (
            <Grid.Col span={12} key={index}>
            <h3 className='mb-2'>{key}</h3>
            <Grid>
                {Object.entries(value).map(([subkey, subvalue], subIndex) => (
                <Grid.Col span={2} key={subkey}>
                    <Tooltip label={subvalue} withArrow>
                    <Checkbox
                        label={subkey}
                        id={`checkbox-${key}-${subkey}`}
                        checked={wantedData[`${key}-${subkey}`] || false}
                        onChange={(e) => handleCheckboxChange(key, subkey, e.target.checked)}
                    />
                    </Tooltip>
                </Grid.Col>
                ))}
            </Grid>
            </Grid.Col>
          ))}
        </Grid>
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
  