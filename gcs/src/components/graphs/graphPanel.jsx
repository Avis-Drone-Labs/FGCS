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
import { graphOptions } from '../../helpers/realTimeGraphOptions.js'

// Helper function to extract graph information
const getGraphInfo = (selectValue) => {
  if (!selectValue) return null;
  const [category, value] = selectValue.split('/');
  return {
    value,
    label: `${value} ${graphOptions[category][value]}`
  };
};

// GraphPanel component
export default function GraphPanel({ selectValues, graphRefs, graphColors }) {
  const renderGraph = (graphKey) => {
    const graphInfo = getGraphInfo(selectValues[graphKey]);
    
    if (graphInfo) {
      return (
        <RealtimeGraph
          ref={graphRefs[graphKey]}
          datasetLabel={graphInfo.label}
          lineColor={graphColors[graphKey]}
        />
      );
    }
    
    return (
      <p className='flex items-center justify-center h-full'>
        Select a value to plot on graph {graphKey.charAt(graphKey.length - 1).toUpperCase()}
      </p>
    );
  };

  return (
    <PanelGroup
      autoSaveId='verticalGraphs'
      direction='vertical'
      className='h-full'
    >
      <Panel minSize={20}>
        <PanelGroup autoSaveId='horizontalGraphs1' direction='horizontal'>
          <Panel minSize={10}>
            {renderGraph('graph_a')}
          </Panel>
          <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
          <Panel minSize={10}>
            {renderGraph('graph_b')}
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className='h-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
      <Panel minSize={20}>
        <PanelGroup autoSaveId='horizontalGraphs2' direction='horizontal'>
          <Panel minSize={10}>
            {renderGraph('graph_c')}
          </Panel>
          <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
          <Panel minSize={10}>
            {renderGraph('graph_d')}
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}