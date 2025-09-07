/*
  Drone parameter screen.

  Allows the user to change drone parameters via MavLink messages. TODO: Rephrase this!
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Progress } from "@mantine/core"
import {
  useDebouncedValue,
  useDisclosure,
  useListState,
  useToggle,
} from "@mantine/hooks"
import AutoSizer from "react-virtualized-auto-sizer"
import { FixedSizeList } from "react-window"

// Custom components, helpers, and data
import Layout from "./components/layout.jsx"
import NoDroneConnected from "./components/noDroneConnected.jsx"
import AutopilotRebootModal from "./components/params/autopilotRebootModal.jsx"
import ParamsToolbar from "./components/params/paramsToolbar.jsx"
import { Row } from "./components/params/row.jsx"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification.js"
import { socket } from "./helpers/socket.js"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice.js"
import {
  appendModifiedParams,
  selectAutoPilotRebootModalOpen,
  selectFetchingVars,
  selectFetchingVarsProgress,
  selectModifiedParams,
  selectParams,
  selectRebootData,
  selectShowModifiedParams,
  selectShownParams,
  setAutoPilotRebootModalOpen,
  setFetchingVars,
  setFetchingVarsProgress,
  setModifiedParams,
  setParams,
  setRebootData,
  setShownParams,
  toggleShowModifiedParams,
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

  // Autopilot reboot states
  const rebootData = useSelector(selectRebootData)
  const opened = useSelector(selectAutoPilotRebootModalOpen)

  // Searchbar states
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 150)

  // Fetch progress states
  const fetchingVars = useSelector(selectFetchingVars)
  const fetchingVarsProgress = useSelector(selectFetchingVarsProgress)

  /**
   * Resets the state of the parameters page to the initial states
   */
  function resetState() {
    dispatch(setFetchingVars(false))
    dispatch(setFetchingVarsProgress(0))
    dispatch(setParams([]))
    dispatch(setShownParams([]))
    dispatch(setModifiedParams([]))
    dispatch(setRebootData({}))
    setSearchValue("")
  }

  /**
   * Sends a request to the drone to reboot the autopilot
   */
  function rebootAutopilot() {
    socket.emit("reboot_autopilot")
    dispatch(setAutoPilotRebootModalOpen(true))
    resetState()
  }

  /**
   * Refreshes the params on the drone then fetches them
   */
  function refreshParams() {
    dispatch(setParams([]))
    dispatch(setShownParams([]))
    socket.emit("refresh_params")
    dispatch(setFetchingVars(true))
  }

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

  // /**
  //  * Updates the parameter value in the given useListState handler
  //  *
  //  * @param {*} handler
  //  * @param {*} param
  //  * @param {*} value
  //  */
  // function updateParamValue(handler, param, value) {
  //   // TODO: THIS NEEDS MODIFYING BEFORE REDUX BECAUSE OF APPLY WHERE
  //   // DON'T FORGET BEFORE MERGE!
  //   handler.applyWhere(
  //     (item) => item.param_id === param.param_id,
  //     (item) => ({ ...item, param_value: value }),
  //   )
  // }

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
      param.param_value = value
      dispatch(appendModifiedParams(param))
    }

    dispatch(updateParamValue({ param_id: param.param_id, param_value: value }))
  }

  useEffect(() => {
    // Updates the autopilot modal depending on the success of the reboot
    socket.on("reboot_autopilot", (msg) => {
      dispatch(setRebootData(msg))
      if (msg.success) {
        dispatch(setAutoPilotRebootModalOpen(false))
      }
    })

    // Drone has lost connection
    if (!connected) {
      resetState()
      return
    }

    // Fetch params on connection to drone
    if (connected && Object.keys(params).length === 0 && !fetchingVars) {
      dispatch(setFetchingVars(true))
    }

    // Update parameter states when params are received from drone
    socket.on("params", (params) => {
      dispatch(setParams(params))
      dispatch(setShownParams(params))
      dispatch(setFetchingVars(false))
      dispatch(setFetchingVarsProgress(0))
      setSearchValue("")
    })

    // Set fetch progress on update from drone
    socket.on("param_request_update", (msg) => {
      dispatch(
        setFetchingVarsProgress(
          (msg.current_param_index / msg.total_number_of_params) * 100,
        ),
      )
    })

    // Show success on saving modified params
    socket.on("param_set_success", (msg) => {
      showSuccessNotification(msg.message)
      dispatch(setModifiedParams([]))
    })

    // Show error message on drone error
    socket.on("params_error", (err) => {
      showErrorNotification(err.message)
      dispatch(setFetchingVars(false))
    })

    //
    return () => {
      socket.off("params")
      socket.off("param_request_update")
      socket.off("param_set_success")
      socket.off("params_error")
      socket.off("reboot_autopilot")
    }
  }, [connected]) // useEffect

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
          <AutopilotRebootModal
            rebootData={rebootData}
            opened={opened}
            onClose={() => {
              dispatch(setAutoPilotRebootModalOpen(false))
            }}
          />

          {fetchingVars && (
            <Progress
              radius="xs"
              value={fetchingVarsProgress}
              className="w-1/3 mx-auto my-auto"
            />
          )}

          {Object.keys(params).length !== 0 && (
            <div className="w-full h-full contents">
              <ParamsToolbar
                searchValue={searchValue}
                modifiedParams={modifiedParams}
                showModifiedParams={showModifiedParams}
                refreshCallback={refreshParams}
                rebootCallback={rebootAutopilot}
                modifiedCallback={() => dispatch(toggleShowModifiedParams())}
                searchCallback={setSearchValue}
              />

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
