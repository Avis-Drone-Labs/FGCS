/*
Component containing the toolbar for the parameters page

Contains the search bar, as well as the buttons for toggling shown parameters, saving and refreshing parameters, and
rebooting the autopilot
*/

// 3rd party imports
import { TextInput } from "@mantine/core"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  selectParamSearchValue,
  setParamSearchValue
} from "../../redux/slices/paramsSlice.js"

export default function ParamsToolbar() {
  const dispatch = useDispatch()
  const searchValue = useSelector(selectParamSearchValue)

  return (
    <div className="flex justify-center gap-4 m-4">
      <TextInput
        className="w-1/3"
        placeholder="Search by parameter name"
        value={searchValue}
        onChange={(event) =>
          dispatch(setParamSearchValue(event.currentTarget.value))
        }
      />
    </div>
  )
}
