import Graph from './graph'

export default function GraphArray({ graphs }) {
  return (
    <div className='flex flex-row flex-nowrap justify-between align-center w-full h-full'>
      {graphs.map((graph) => {
        return (
          <Graph
            key={graph.datasetLabel}
            data={graph.data}
            datasetLabel={graph.datasetLabel}
            lineColor={graph.lineColor}
            pointColor={graph.pointColor}
            maxNumberOfDataPoints={graph.maxNumberOfDataPoints}
          />
        )
      })}
    </div>
  )
}
