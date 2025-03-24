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
  useSessionStorage,
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

export default function Params() {
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: true,
  })

  // Parameter states
  const [params, paramsHandler] = useListState([])
  const [shownParams, shownParamsHandler] = useListState([])
  const [modifiedParams, modifiedParamsHandler] = useListState([])
  const [showModifiedParams, showModifiedParamsToggle] = useToggle()

  // Autopilot reboot states
  const [rebootData, setRebootData] = useState({})
  const [opened, { open, close }] = useDisclosure(false)

  // Searchbar states
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 150)

  // Fetch progress states
  const [fetchingVars, setFetchingVars] = useState(false)
  const [fetchingVarsProgress, setFetchingVarsProgress] = useState(0)

  /**
   * Resets the state of the parameters page to the initial states
   */
  function resetState() {
    setFetchingVars(false)
    setFetchingVarsProgress(0)
    paramsHandler.setState([])
    shownParamsHandler.setState([])
    modifiedParamsHandler.setState([])
    setSearchValue("")
    setRebootData({})
  }

  /**
   * Sends a request to the drone to reboot the autopilot
   */
  function rebootAutopilot() {
    socket.emit("reboot_autopilot")
    open()
    resetState()
  }

  /**
   * Refreshes the params on the drone then fetches them
   */
  function refreshParams() {
    paramsHandler.setState([])
    shownParamsHandler.setState([])
    socket.emit("refresh_params")
    setFetchingVars(true)
  }

  /**
   * Checks if a paramter has been modified since the last save
   * @param {*} param the parameter to check
   * @returns true if the given parameter is in modifiedParams, otherwise false
   */
  function isModified(param) {
    return modifiedParams.find((obj) => {
      return obj.param_id === param.param_id
    })
  }

  /**
   * Updates the parameter value in the given useListState handler
   *
   * @param {*} handler
   * @param {*} param
   * @param {*} value
   */
  function updateParamValue(handler, param, value) {
    handler.applyWhere(
      (item) => item.param_id === param.param_id,
      (item) => ({ ...item, param_value: value }),
    )
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

    // If param has already been modified since last save then update it
    if (isModified(param)) updateParamValue(modifiedParamsHandler, param, value)
    else {
      // Otherwise add it to modified params
      param.param_value = value
      modifiedParamsHandler.append(param)
    }

    updateParamValue(paramsHandler, param, value)
  }

  useEffect(() => {
    // Updates the autopilot modal depending on the success of the reboot
    socket.on("reboot_autopilot", (msg) => {
      setRebootData(msg)
      if (msg.success) {
        close()
      }
    })

    // Drone has lost connection
    if (!connected) {
      resetState()
      return
    }

    // Fetch params on connection to drone
    if (connected && Object.keys(params).length === 0 && !fetchingVars) {
      socket.emit("set_state", { state: "params" })
      setFetchingVars(true)
    }

    // Update parameter states when params are receieved from drone
    socket.on("params", (params) => {
      paramsHandler.setState(params)
      shownParamsHandler.setState(params)
      setFetchingVars(false)
      setFetchingVarsProgress(0)
      setSearchValue("")
    })

    // Set fetch progress on update from drone
    socket.on("param_request_update", (msg) => {
      setFetchingVarsProgress(
        (msg.current_param_index / msg.total_number_of_params) * 100,
      )
    })

    // Show success on saving modified params
    socket.on("param_set_success", (msg) => {
      showSuccessNotification(msg.message)
      modifiedParamsHandler.setState([])
    })

    // Show error message on drone error
    socket.on("params_error", (err) => {
      showErrorNotification(err.message)
      setFetchingVars(false)
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
    shownParamsHandler.setState(filteredParams)
  }, [debouncedSearchValue, showModifiedParams])

  return (
    <Layout currentPage="params">
      {connected ? (
        <>
          <AutopilotRebootModal
            rebootData={rebootData}
            opened={opened}
            onClose={close}
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
                modifiedCallback={showModifiedParamsToggle}
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
