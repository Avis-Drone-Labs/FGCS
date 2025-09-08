/*
  Live graph data screen.

  This shows 4 different graphs following the live data chosen from the user. These graphs can change size will update in real time as new messages are sent to the GCS.
*/

// Base imports
import { useEffect, useRef } from "react"

// 3rd Party Imports
import { usePrevious } from "@mantine/hooks"

// Custom components and helpers
import GraphPanel from "./components/graphs/graphPanel.jsx"
import MessageSelector from "./components/graphs/messageSelector.jsx"
import Layout from "./components/layout"
import NoDroneConnected from "./components/noDroneConnected.jsx"
import { graphOptions } from "./helpers/realTimeGraphOptions.js"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice.js"
import {
  selectGraphValues,
  selectLastGraphMessage,
  setGraphValues,
} from "./redux/slices/droneInfoSlice.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const graphLabelColors = {
  graph_a: "text-sky-400",
  graph_b: "text-pink-400",
  graph_c: "text-orange-400",
  graph_d: "text-green-400",
}

const graphColors = {
  graph_a: tailwindColors.sky[400],
  graph_b: tailwindColors.pink[400],
  graph_c: tailwindColors.orange[400],
  graph_d: tailwindColors.green[400],
}

export default function Graphs() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const selectValues = useSelector(selectGraphValues)
  const lastGraphMessage = useSelector(selectLastGraphMessage)

  const previousSelectValues = usePrevious(selectValues)

  const graphRefs = {
    graph_a: useRef(null),
    graph_b: useRef(null),
    graph_c: useRef(null),
    graph_d: useRef(null),
  }

  useEffect(() => {
    if (lastGraphMessage !== false) {
      lastGraphMessage.forEach((graphResult) => {
        graphRefs[graphResult.graphKey]?.current.data.datasets[0].data.push(
          graphResult.data,
        )
        graphRefs[graphResult.graphKey]?.current.update("quiet")
      })
    }
  }, [lastGraphMessage])

  useEffect(() => {
    if (!previousSelectValues) return

    for (let graphKey in selectValues) {
      if (
        graphRefs[graphKey].current !== null &&
        selectValues[graphKey] !== previousSelectValues[graphKey] &&
        selectValues[graphKey] !== null
      ) {
        graphRefs[graphKey].current.data.datasets[0].data = []
        graphRefs[graphKey].current.update("quiet")
      }
    }
  }, [previousSelectValues])

  function updateSelectValues(values) {
    const updatedSelectValues = { ...selectValues, ...values }
    dispatch(setGraphValues(updatedSelectValues))
  }

  return (
    <Layout currentPage="graphs">
      {connected ? (
        <div className="flex flex-col gap-2 h-full">
          <div className="flex flex-row gap-4 w-fit mx-auto">
            <MessageSelector
              graphOptions={graphOptions}
              label="Graph A"
              labelColor={graphLabelColors.graph_a}
              valueKey="graph_a"
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label="Graph B"
              labelColor={graphLabelColors.graph_b}
              valueKey="graph_b"
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label="Graph C"
              labelColor={graphLabelColors.graph_c}
              valueKey="graph_c"
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label="Graph D"
              labelColor={graphLabelColors.graph_d}
              valueKey="graph_d"
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
          </div>
          <GraphPanel
            selectValues={selectValues}
            graphRefs={graphRefs}
            graphColors={graphColors}
          />
        </div>
      ) : (
        <NoDroneConnected tab="graphs" />
      )}
    </Layout>
  )
}
