import Graph from './graph'

export default function GraphArray({ graphs }) {
  return (
    <div className="flex flex-row flex-wrap justify-between w-full">
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
