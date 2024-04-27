/*
  GraphPanel Component

  This component is responsible for rendering a group of resizable panels, each containing a RealtimeGraph component.
  The graphs are displayed based on the selected values passed as props. If no value is selected for a graph,
  a message prompts the user to select a value for that graph.

  Props:
    - selectValues: An object containing the selected values for each graph.
    - graphRefs: An object containing the refs for each graph.
    - graphColors: An object containing the colors for each graph.
*/

// 3rd Party Imports
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import RealtimeGraph from '../realtimeGraph.jsx'

export default function GraphPanel({ selectValues, graphRefs, graphColors }) {
  return (
    <PanelGroup
      autoSaveId='verticalGraphs'
      direction='vertical'
      className='h-full'
    >
      <Panel minSize={20}>
        <PanelGroup autoSaveId='horizontalGraphs1' direction='horizontal'>
          <Panel minSize={10}>
            {selectValues.graph_a ? (
              <RealtimeGraph
                ref={graphRefs.graph_a}
                datasetLabel={selectValues.graph_a.split('/')[1]}
                lineColor={graphColors.graph_a}
              />
            ) : (
              <p className='flex items-center justify-center h-full'>
                Select a value to plot on graph A
              </p>
            )}
          </Panel>

          <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />

          <Panel minSize={10}>
            {selectValues.graph_b ? (
              <RealtimeGraph
                ref={graphRefs.graph_b}
                datasetLabel={selectValues.graph_b.split('/')[1]}
                lineColor={graphColors.graph_b}
              />
            ) : (
              <p className='flex items-center justify-center h-full'>
                Select a value to plot on graph B
              </p>
            )}
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className='h-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
      <Panel minSize={20}>
        <PanelGroup autoSaveId='horizontalGraphs2' direction='horizontal'>
          <Panel minSize={10}>
            {selectValues.graph_c ? (
              <RealtimeGraph
                ref={graphRefs.graph_c}
                datasetLabel={selectValues.graph_c.split('/')[1]}
                lineColor={graphColors.graph_c}
              />
            ) : (
              <p className='flex items-center justify-center h-full'>
                Select a value to plot on graph C
              </p>
            )}
          </Panel>

          <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />

          <Panel minSize={10}>
            {selectValues.graph_d ? (
              <RealtimeGraph
                ref={graphRefs.graph_d}
                datasetLabel={selectValues.graph_d.split('/')[1]}
                lineColor={graphColors.graph_d}
              />
            ) : (
              <p className='flex items-center justify-center h-full'>
                Select a value to plot on graph D
              </p>
            )}
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )
}
