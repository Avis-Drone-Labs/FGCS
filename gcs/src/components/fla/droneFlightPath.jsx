// DroneFlightPath.jsx
import {
  Cartesian3,
  Color,
  Ion,
  JulianDate,
  PathGraphics,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  VelocityOrientationProperty,
} from 'cesium'
import { useEffect, useState } from 'react'
import { Clock, Entity, Viewer } from 'resium'
import data from './flightdata.json'

Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkODdjNjMyYy00OGQ4LTQzNmUtYTQ1MC0xYmVmN2VmYWY2YzkiLCJpZCI6MjA1ODQ4LCJpYXQiOjE3MTE5ODMzMDR9.QumArMVhHylPYjVV1hqI38aMPG1vVd6RXBsX4wNDzKg'

export default function DroneFlightPath({ gpsData }) {
  const [positions, setPositions] = useState(null)
  const [droneLine, setDroneLine] = useState(null)

  const timeStepInSeconds = 30
  const totalSeconds = timeStepInSeconds * (data.length - 1)
  const start = JulianDate.fromIso8601('2020-03-09T23:10:00Z')
  const stop = JulianDate.addSeconds(start, totalSeconds, new JulianDate())

  const positionProperty = new SampledPositionProperty()

  useEffect(() => {
    if (!gpsData) {
      return
    }

    const firstPosition = gpsData[0]

    setPositions(
      gpsData.map((item, index) => {
        // Declare the time for this individual sample and store it in a new JulianDate instance.
        const time = JulianDate.addSeconds(
          start,
          index * timeStepInSeconds,
          new JulianDate(),
        )

        const position = Cartesian3.fromDegrees(
          item.longitude,
          item.latitude,
          item.height - firstPosition.height,
        )

        // Store the position along with its timestamp.
        // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
        positionProperty.addSample(time, position)

        return position
      }),
    )
  }, [gpsData])

  useEffect(() => {
    if (positions === null) return

    setDroneLine(
      <Entity
        availability={
          new TimeIntervalCollection([
            new TimeInterval({ start: start, stop: stop }),
          ])
        }
        position={positionProperty}
        // model={{
        //   uri:'./droneModel/drone.gltf',
        //   minimumPixelSize:28, // adjust drone size here
        //   maximumScale:50
        // }}
        point={{ pixelSize: 25, color: Color.GREEN }} // for testing
        orientation={new VelocityOrientationProperty(positionProperty)}
        path={new PathGraphics({ width: 3 })}
        tracked
        selected
      />,
    )
  }, [positions])

  return (
    <Viewer>
      <Clock
        startTime={start.clone()}
        stopTime={stop.clone()}
        currentTime={start.clone()}
        multiplier={50}
        shouldAnimate={true}
      >
        {positions?.map((position, index) => (
          <Entity
            key={index}
            position={position}
            point={{ pixelSize: '4', color: Color.RED }}
          />
        ))}
        {droneLine}
      </Clock>
    </Viewer>
  )
}
