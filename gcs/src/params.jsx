/*
  Drone parameter screen.

  Allows the user to change drone parameters via MavLink messages. TODO: Rephrase this!
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Button, Divider, Progress } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { ResizableBox } from "react-resizable"
import AutoSizer from "react-virtualized-auto-sizer"
import { FixedSizeList } from "react-window"

// Custom components, helpers, and data
import Layout from "./components/layout.jsx"
import NoDroneConnected from "./components/noDroneConnected.jsx"
import ParamsToolbar from "./components/params/paramsToolbar.jsx"
import { Row } from "./components/params/row.jsx"
import { useRebootCallback } from "./helpers/droneConnectionCallbacks.js"

// Redux
import { useDispatch, useSelector } from "react-redux"
import LoadParamsFileModal from "./components/params/loadParamsFileModal.jsx"
import ParamsFailedToWriteModal from "./components/params/paramsFailedToWriteModal.jsx"
import ParamsWriteModal from "./components/params/paramsWriteModal.jsx"
import { EXCLUDE_PARAMS_LOAD } from "./helpers/mavlinkConstants.js"
import { showErrorNotification } from "./helpers/notification.js"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice.js"
import {
  emitExportParamsToFile,
  emitRefreshParams,
  emitSetMultipleParams,
  resetParamState,
  selectFetchingVars,
  selectFetchingVarsProgress,
  selectHasFetchedOnce,
  selectModifiedParams,
  selectParams,
  selectParamSearchValue,
  selectShowModifiedParams,
  selectShownParams,
  setFetchingVars,
  setHasFetchedOnce,
  setLoadedFileName,
  setLoadedParams,
  setLoadParamsFileModalOpen,
  setModifiedParams,
  setParams,
  setShownParams,
} from "./redux/slices/paramsSlice.js"

function cleanFloat(value, decimals = 5) {
  if (typeof value === "number") {
    return Number(value.toFixed(decimals))
  }
  if (!isNaN(value)) {
    return Number(parseFloat(value).toFixed(decimals))
  }
  return value
}

export default function Params() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const rebootCallback = useRebootCallback()

  // Parameter states
  const hasFetchedOnce = useSelector(selectHasFetchedOnce)
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

  // Reset state if we loose connection
  useEffect(() => {
    if (!connected) {
      dispatch(resetParamState())
    }

    if (connected && !hasFetchedOnce && !fetchingVars) {
      fetchParams()
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
  }, [debouncedSearchValue, showModifiedParams, params, modifiedParams])

  function fetchParams() {
    dispatch(setFetchingVars(true))
    dispatch(emitRefreshParams())
    dispatch(setHasFetchedOnce(true))
  }

  function refreshCallback() {
    dispatch(setParams([]))
    dispatch(setModifiedParams([]))
    dispatch(setShownParams([]))
    dispatch(emitRefreshParams())
    dispatch(setFetchingVars(true))
  }

  async function saveParamsToFile() {
    const options = {
      title: "Save parameters to a file",
      filters: [
        { name: "Param File", extensions: ["param"] },
        { name: "All Files", extensions: ["*"] },
      ],
    }

    const result = await window.ipcRenderer.invoke(
      "app:get-save-file-path",
      options,
    )

    if (!result.canceled) {
      dispatch(
        emitExportParamsToFile({
          filePath: result.filePath,
        }),
      )
    }
  }

  async function loadParamsFromFile() {
    const result = await window.ipcRenderer.invoke(
      "params:load-params-from-file",
    )
    if (!result) {
      return
    }

    if (result.success) {
      dispatch(setLoadedFileName(result.name))

      // Only keep params that are different to the current ones
      const loadedParamsList = []
      for (const [key, value] of Object.entries(result.params)) {
        if (EXCLUDE_PARAMS_LOAD.includes(key)) {
          continue
        }

        const existingParam = params.find((param) => param.param_id === key)
        const cleanedNewValue = cleanFloat(value)

        if (existingParam) {
          const cleanedOldValue = cleanFloat(existingParam.param_value)

          if (cleanedOldValue !== cleanedNewValue) {
            loadedParamsList.push({
              id: key,
              oldValue: cleanedOldValue,
              newValue: cleanedNewValue,
              type: existingParam.param_type,
            })
          }
        } else {
          loadedParamsList.push({
            id: key,
            oldValue: null,
            newValue: cleanedNewValue,
            type: null,
          })
        }
      }
      dispatch(setLoadedParams(loadedParamsList))
      dispatch(setLoadParamsFileModalOpen(true))
    } else {
      showErrorNotification(
        `Error loading params from file: ${
          result.error || "Please try again."
        }`,
      )
    }
  }

  return (
    <Layout currentPage="params">
      <LoadParamsFileModal />
      <ParamsWriteModal />
      <ParamsFailedToWriteModal />

      {connected ? (
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {!fetchingVars && (
              <ResizableBox
                width={225}
                height={Infinity}
                minConstraints={[225, Infinity]}
                maxConstraints={[600, Infinity]}
                resizeHandles={["e"]}
                axis="x"
                handle={
                  <div className="w-2 h-full bg-falcongrey-900 hover:bg-falconred-500 cursor-col-resize absolute right-0 top-0 z-10"></div>
                }
                className="relative bg-falcongrey-800 overflow-y-auto"
              >
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-4">
                    <Button onClick={refreshCallback} className="grow">
                      Refresh params
                    </Button>
                    <Button
                      disabled={!modifiedParams.length}
                      onClick={() =>
                        dispatch(emitSetMultipleParams(modifiedParams))
                      }
                      className="grow"
                    >
                      Write params
                    </Button>
                  </div>
                  <Divider />
                  <div className="flex flex-col gap-4">
                    <Button onClick={saveParamsToFile} className="grow">
                      Save to file
                    </Button>
                    <Button onClick={loadParamsFromFile} className="grow">
                      Load from file
                    </Button>
                  </div>
                  <Divider />
                  <div className="flex flex-col gap-4">
                    <Button onClick={rebootCallback} color={"red"}>
                      Reboot FC
                    </Button>
                  </div>
                </div>
              </ResizableBox>
            )}

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {fetchingVars && (
                <div className="my-auto">
                  {fetchingVarsProgress.param_id && (
                    <p className="text-center my-4">
                      Fetched {fetchingVarsProgress.param_id}
                    </p>
                  )}
                  <Progress
                    radius="xs"
                    value={fetchingVarsProgress.progress}
                    className="w-1/3 mx-auto my-auto"
                  />
                </div>
              )}

              {Object.keys(params).length > 0 && !fetchingVars && (
                <div className="h-full contents">
                  <ParamsToolbar />

                  <div className="h-full">
                    <AutoSizer>
                      {({ height, width }) => (
                        <FixedSizeList
                          height={height}
                          width={width}
                          itemSize={120}
                          itemCount={shownParams.length}
                        >
                          {Row}
                        </FixedSizeList>
                      )}
                    </AutoSizer>
                  </div>
                </div>
              )}
              {Object.keys(params).length === 0 && !fetchingVars && (
                <div className="flex flex-col my-auto mx-auto">
                  <p className="text-center my-4">
                    No parameters found, try fetching them again.
                  </p>
                  <Button onClick={() => fetchParams()}>Fetch Params</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <NoDroneConnected tab="params" />
      )}
    </Layout>
  )
}
