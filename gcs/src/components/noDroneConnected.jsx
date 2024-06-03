export default function NoDroneConnected() {
  return (
    <div className='flex items-center justify-center h-full'>
      <p className='text-red-400'>
        Not connected to drone. Please connect to view graphs
      </p>
    </div>
  )
}
