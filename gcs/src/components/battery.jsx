import { Card, CategoryBar, Metric, Text } from '@tremor/react'

import InfoCard from './infoCard'

export default function BatterySection({ data }) {
  return (
    <div className="w-full grid grid-cols-1 grid-row-3 gap-2 p-2 ">
      <InfoCard
        text="Battery voltage"
        metric={data.voltages && data.voltages[0] / 1000}
        unit="V"
        className="mx-0"
      />
      <InfoCard
        text="Battery current"
        metric={data['current_battery'] / 100}
        unit="A"
        className="mx-0"
      />
      <Card className="ring-0 bg-falcongrey-80">
        <Text className="text-neutral-200">Battery level</Text>
        <Metric className="text-neutral-50">
          {data['battery_remaining']}%
        </Metric>
        <CategoryBar
          categoryPercentageValues={[10, 25, 45, 20]}
          colors={['rose', 'orange', 'yellow', 'emerald']}
          percentageValue={data['Battery level']}
        />
      </Card>
    </div>
  )
}
