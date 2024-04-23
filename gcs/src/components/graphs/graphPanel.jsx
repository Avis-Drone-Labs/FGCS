import React from 'react';

// 3rd Party Imports
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import RealtimeGraph from '../realtimeGraph.jsx'

export default function GraphPanel({ 
  selectValues, 
  graphRefs, 
  graphColors 
}){
  return(
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
          <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
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