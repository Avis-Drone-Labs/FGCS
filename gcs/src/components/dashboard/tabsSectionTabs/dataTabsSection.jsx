/**
 * DataTabsSection
 * This file contains all relevant components to display drone data with the data tab in tabsSection.
 */

// Native
import { useState } from "react"

// Mantine
import { Grid, Tabs } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"

// Custom Components
import DashboardDataModal from "../../dashboardDataModal"

// Icons
import { IconInfoCircle } from "@tabler/icons-react"

// Helper
import { useDispatch, useSelector } from "react-redux"
import { DataMessage } from "../../../helpers/dataDisplay"
import {
  changeSelectedDisplayTelemetry,
  selectSelectedDisplayTelemetry,
} from "../../../redux/slices/droneInfoSlice"

export default function DataTabsSection({ tabPadding }) {
  const [selectedBox, setSelectedBox] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)

  const dispatch = useDispatch()
  const selectedData = useSelector(selectSelectedDisplayTelemetry)

  const handleDoubleClick = (box) => {
    setSelectedBox(box)
    open()
  }

  const handleCheckboxChange = (key, subkey, subvalue, boxId, isChecked) => {
    // Update wantedData on checkbox change
    if (isChecked) {
      dispatch(
        changeSelectedDisplayTelemetry({
          index: boxId,
          data: {
            currently_selected: `${key}.${subkey}`,
            display_name: subvalue,
            value: 0,
          },
        }),
      )
      close()
    }
  }

  return (
    <Tabs.Panel value="data">
      <div className={tabPadding}>
        <Grid className="cursor-pointer select-none">
          {selectedData.length > 0 ? (
            selectedData.map((data) => (
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
            <div className="flex justify-center items-center p-4">
              <IconInfoCircle size={20} />
              <p className="ml-2">Double Click to select data</p>
            </div>
          )}
        </Grid>
        <DashboardDataModal
          opened={opened}
          close={close}
          selectedBox={selectedBox}
          handleCheckboxChange={handleCheckboxChange}
        />
      </div>
    </Tabs.Panel>
  )
}
