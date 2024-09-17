export default function TelemetryValueDisplay({ title, value, fs }) {
  return (
    <p className='font-bold' style={{fontSize: `${fs}rem`, lineHeight: '1.75rem'}}>
      {title} <br /> {value}
    </p>
  )
}
