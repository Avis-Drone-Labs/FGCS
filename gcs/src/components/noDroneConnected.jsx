export default function NoDroneConnected({ tab }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-400">
        Not connected to drone. Please connect to view {tab}
      </p>
    </div>
  )
}
