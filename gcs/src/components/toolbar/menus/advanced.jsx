/*
  Advanced menu button and dropdown, this is for the toolbar.
*/

// Local Imports
import { useDispatch, useSelector } from "react-redux"
import { emitStartSimulation, emitStopSimulation, selectIsSimulationRunning, setForwardingAddressModalOpened } from "../../../redux/slices/droneConnectionSlice"
import MenuItem from "./menuItem"
import MenuTemplate from "./menuTemplate"

export default function AdvancedMenu(props) {
  const dispatch = useDispatch()
  const isSimulationRunning = useSelector(selectIsSimulationRunning)
  return (
    <MenuTemplate
      title="Advanced"
      areMenusActive={props.areMenusActive}
      setMenusActive={props.setMenusActive}
    >
      <MenuItem
        name="Connection Stats"
        onClick={() => {
          window.ipcRenderer.invoke("app:open-link-stats-window")
        }}
      />
      <MenuItem
        name="MAVLink Forwarding"
        onClick={() => {
          dispatch(setForwardingAddressModalOpened(true))
        }}
      />
      <MenuItem
        name={
          isSimulationRunning
            ? "Stop Simulation"
            : "Start Simulation with Docker"
        }
        onClick={() => {
          dispatch(
            isSimulationRunning
              ? emitStopSimulation()
              : emitStartSimulation()
          );
        }}
      />
    </MenuTemplate>
  )
}
