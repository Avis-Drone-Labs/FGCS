/*
  Drone parameter screen.

  Allows the user to change drone parameters via MavLink messages. TODO: Rephrase this!
*/

// Base imports
import { useEffect } from "react"

// 3rd Party Imports
import { Button, Progress } from "@mantine/core"
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
  emitRefreshParams,
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
  setShownParams,
} from "./redux/slices/paramsSlice.js"

export default function Params() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)

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

  function fetchParams() {
    dispatch(setFetchingVars(true))
    dispatch(emitRefreshParams())
    dispatch(setHasFetchedOnce(true))
  }

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

  return (
    <Layout currentPage="params">
      <AutopilotRebootModal />

      {connected ? (
        <>
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
        </>
      ) : (
        <NoDroneConnected tab="params" />
      )}
    </Layout>
  )
}
