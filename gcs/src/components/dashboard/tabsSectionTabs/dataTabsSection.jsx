/**
 * DataTabsSection
 * This file contains all relevant components to display drone data with the data tab in tabsSection.
 */

// Native
import { useState } from "react"

// Mantine
import { useDisclosure } from "@mantine/hooks"
import { Tabs, Grid } from "@mantine/core"

// Custom Components
import DashboardDataModal from "../../dashboardDataModal"

// Icons
import { IconInfoCircle } from "@tabler/icons-react"

// Helper
import { DataMessage } from "../../../helpers/dataDisplay"

export default function DataTabsSection({
  tabPadding,
  displayedData,
  setDisplayedData,
}) {
  const [selectedBox, setSelectedBox] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)

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

  return (
    
    <Tabs.Panel value="data">
      <div className="p-2">
        <button
          onClick={() => {
            localStorage.removeItem("dashboardDataMessages")
            window.location.reload()
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reset Dashboard
        </button>
      </div>
      <div className={tabPadding}>
        <Grid className="cursor-pointer select-none">
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
