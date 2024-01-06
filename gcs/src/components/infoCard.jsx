import { Card, Metric, Text } from '@tremor/react'

export default function InfoCard(props) {
  return (
    <Card className={`ring-0 bg-falcongrey-80/75 ${props.className}`}>
      <Text className="text-neutral-200">{props.text}</Text>
      <Metric className="text-neutral-50">
        {props.metric}
        <span className="text-lg">{props.unit && props.unit}</span>
      </Metric>
    </Card>
  )
}
