export default function TelemetryValueDisplay({ title, value, fs }) {
  return (
    <p className='font-bold' style={{fontSize: `${fs*1.25}rem`, lineHeight: `${fs*1.75}rem`}}>
      {title} <br /> {value}
    </p>
  )
}
