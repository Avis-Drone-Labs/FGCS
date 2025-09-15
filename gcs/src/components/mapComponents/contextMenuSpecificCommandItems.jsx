import { useDispatch, useSelector } from "react-redux"
import { coordToInt } from "../../helpers/dataFormatters"
import { COPTER_MISSION_ITEM_COMMANDS_LIST } from "../../helpers/mavlinkConstants"
import {
  createNewSpecificMissionItem,
  selectActiveTab,
  selectContextMenu,
} from "../../redux/slices/missionSlice"
import ContextMenuItem from "./contextMenuItem"

function getMissionCommandIdByName(name) {
  return parseInt(
    Object.keys(COPTER_MISSION_ITEM_COMMANDS_LIST).find(
      (key) => COPTER_MISSION_ITEM_COMMANDS_LIST[key] === name,
    ),
  )
}

const defaultCommandAltitude = 30 // TODO: make this user configurable

export default function ContextMenuSpecificCommandItems() {
  const dispatch = useDispatch()
  const activeTab = useSelector(selectActiveTab)
  const contextMenuState = useSelector(selectContextMenu)

  function addSpecificMissionItem(commandData) {
    dispatch(createNewSpecificMissionItem(commandData))
  }

  // TODO: Add support for loiter commands in sub-menu, as well as modal input for parameters e.g. takeoff altitude

  if (activeTab === "mission") {
    return (
      <>
        <ContextMenuItem
          onClick={() =>
            addSpecificMissionItem({
              command: getMissionCommandIdByName("MAV_CMD_NAV_WAYPOINT"),
              x: coordToInt(contextMenuState.gpsCoords.lat),
              y: coordToInt(contextMenuState.gpsCoords.lng),
              z: defaultCommandAltitude,
            })
          }
        >
          <p>Add waypoint</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            addSpecificMissionItem({
              command: getMissionCommandIdByName("MAV_CMD_NAV_TAKEOFF"),
              x: 0,
              y: 0,
              z: 30,
            })
          }
        >
          <p>Add takeoff</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            addSpecificMissionItem({
              command: getMissionCommandIdByName("MAV_CMD_NAV_LAND"),
              x: coordToInt(contextMenuState.gpsCoords.lat),
              y: coordToInt(contextMenuState.gpsCoords.lng),
              z: 1,
            })
          }
        >
          <p>Add land</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            addSpecificMissionItem({
              command: getMissionCommandIdByName(
                "MAV_CMD_NAV_RETURN_TO_LAUNCH",
              ),
              x: 0,
              y: 0,
              z: 0,
            })
          }
        >
          <p>Add RTL</p>
        </ContextMenuItem>
      </>
    )
  }
}
