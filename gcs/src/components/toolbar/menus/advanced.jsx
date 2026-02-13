/*
  Advanced menu button and dropdown, this is for the toolbar.
*/

// Local Imports
import { useDispatch } from "react-redux"
import { setForwardingAddressModalOpened } from "../../../redux/slices/droneConnectionSlice"
import { setSimulationModalOpened } from "../../../redux/slices/simulationParamsSlice"
import MenuItem from "./menuItem"
import MenuTemplate from "./menuTemplate"

export default function AdvancedMenu(props) {
  const dispatch = useDispatch()
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
        name="SITL Simulator"
        onClick={() => {
          dispatch(setSimulationModalOpened(true))
        }}
      />
    </MenuTemplate>
  )
}
