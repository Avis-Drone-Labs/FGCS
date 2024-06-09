export default function TelemetryValueDisplay({ title, value }) {
  return (
    <p className='font-bold text-xl'>
      {title} <br /> {value}
    </p>
  )
}
