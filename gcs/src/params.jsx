/*
  Drone parameter screen.

  Allows the user to change drone parameters via MavLink messages. TODO: Rephrase this!
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Progress } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import AutoSizer from "react-virtualized-auto-sizer"
import { FixedSizeList } from "react-window"

// Custom components, helpers, and data
import Layout from "./components/layout.jsx"
import NoDroneConnected from "./components/noDroneConnected.jsx"
import AutopilotRebootModal from "./components/params/autopilotRebootModal.jsx"
import ParamsToolbar from "./components/params/paramsToolbar.jsx"
import { Row } from "./components/params/row.jsx"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice.js"
import {
  appendModifiedParams,
  resetParamState,
  selectFetchingVars,
  selectFetchingVarsProgress,
  selectModifiedParams,
  selectParams,
  selectParamSearchValue,
  selectShowModifiedParams,
  selectShownParams,
  setFetchingVars,
  setShownParams,
  updateParamValue,
} from "./redux/slices/paramsSlice.js"

export default function Params() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)

  // Parameter states
  const params = useSelector(selectParams)
  const shownParams = useSelector(selectShownParams)
  const modifiedParams = useSelector(selectModifiedParams)
  const showModifiedParams = useSelector(selectShowModifiedParams)

  // Searchbar states
  const searchValue = useSelector(selectParamSearchValue)
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 150)

  // Fetch progress states
  const fetchingVars = useSelector(selectFetchingVars)
  const fetchingVarsProgress = useSelector(selectFetchingVarsProgress)

  /**
   * Checks if a parameter has been modified since the last save
   * @param {*} param the parameter to check
   * @returns true if the given parameter is in modifiedParams, otherwise false
   */
  function isModified(param) {
    return modifiedParams.find((obj) => {
      return obj.param_id === param.param_id
    })
  }

  /**
   * Adds a parameter to the list of parameters that have been modified since the
   * last save
   *
   * @param {*} value
   * @param {*} param
   * @returns
   */
  function addToModifiedParams(value, param) {
    if (value === "") return

    if (isModified(param)) {
      dispatch(
        updateParamValue({ param_id: param.param_id, param_value: value }),
      )
    } else {
      // Otherwise add it to modified params
      dispatch(
        appendModifiedParams({
          param_id: param.param_id,
          param_value: value,
          param_type: param.param_type,
        }),
      )
    }

    dispatch(updateParamValue({ param_id: param.param_id, param_value: value }))
  }

  // Reset state if we loose connection
  useEffect(() => {
    if (!connected) {
      dispatch(resetParamState())
    }

    if (connected && Object.keys(params).length === 0 && !fetchingVars) {
      dispatch(setFetchingVars(true))
    }
  }, [connected])

  useEffect(() => {
    if (!params) return

    // Filter parameters based on search value
    const filteredParams = (
      showModifiedParams ? modifiedParams : params
    ).filter((param) =>
      param.param_id.toLowerCase().includes(debouncedSearchValue.toLowerCase()),
    )

    // Show the filtered parameters
    dispatch(setShownParams(filteredParams))
  }, [debouncedSearchValue, showModifiedParams])

  return (
    <Layout currentPage="params">
      {connected ? (
        <>
          <AutopilotRebootModal />

          {fetchingVars && (
            <Progress
              radius="xs"
              value={fetchingVarsProgress}
              className="w-1/3 mx-auto my-auto"
            />
          )}

          {Object.keys(params).length !== 0 && (
            <div className="w-full h-full contents">
              <ParamsToolbar />

              <div className="h-full w-2/3 mx-auto">
                <AutoSizer>
                  {({ height, width }) => (
                    <FixedSizeList
                      height={height}
                      width={width}
                      itemSize={120}
                      itemCount={shownParams.length}
                      itemData={{
                        params: shownParams,
                        onChange: addToModifiedParams,
                      }}
                    >
                      {Row}
                    </FixedSizeList>
                  )}
                </AutoSizer>
              </div>
            </div>
          )}
        </>
      ) : (
        <NoDroneConnected tab="params" />
      )}
    </Layout>
  )
}
