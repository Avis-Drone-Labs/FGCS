// DroneFlightPath.jsx
import { useState, useEffect } from 'react';
import {
  Ion,
  Cartesian3,
  Color,
  IonResource,
  createWorldTerrainAsync,
  createOsmBuildingsAsync,
  JulianDate,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  PathGraphics,
  VelocityOrientationProperty,
  HeightReference,
  Cartographic,
  sampleTerrain
} from "cesium";
import {
  Viewer,
  Entity,
  Clock
} from "resium";
import data from './flightdata.json'

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkODdjNjMyYy00OGQ4LTQzNmUtYTQ1MC0xYmVmN2VmYWY2YzkiLCJpZCI6MjA1ODQ4LCJpYXQiOjE3MTE5ODMzMDR9.QumArMVhHylPYjVV1hqI38aMPG1vVd6RXBsX4wNDzKg'

/* Initialize the viewer clock:
  Assume the radar samples are 30 seconds apart, and calculate the entire flight duration based on that assumption.
  Get the start and stop date times of the flight, where the start is the known flight departure time (converted from PST 
    to UTC) and the stop is the start plus the calculated duration. (Note that Cesium uses Julian dates. See 
    https://simple.wikipedia.org/wiki/Julian_day.)
  Initialize the viewer's clock by setting its start and stop to the flight start and stop times we just calculated. 
  Also, set the viewer's current time to the start time and take the user to that time. 
*/
// const timeStepInSeconds = 30;
// const totalSeconds = timeStepInSeconds * (data.length - 1);
// const start = JulianDate.fromIso8601("2020-03-09T23:10:00Z");
// const stop = JulianDate.addSeconds(start, totalSeconds, new JulianDate());

// const positionProperty = new SampledPositionProperty();

// const flightData = data.map((item, index)=> {
//   // Declare the time for this individual sample and store it in a new JulianDate instance.
//   const time = JulianDate.addSeconds(start, index * timeStepInSeconds, new JulianDate());
//   const position = Cartesian3.fromDegrees(item.longitude, item.latitude, item.height);
//   // Store the position along with its timestamp.
//   // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
//   positionProperty.addSample(time, position);
//   return(
//     <Entity
//     key={index}
//     position = {position}
//     point={{pixelSize:'4', color:Color.RED}}
//   />
//   );
// });

const DroneFlightPath = async ({ gpsData }) => {
  const [terrainProvider, setTerrainProvider] = useState(null);
  const [osmBuildings, setOsmBuildings] = useState(null); // idk how to use this yet

  const timeStepInSeconds = 30;
  const totalSeconds = timeStepInSeconds * (data.length - 1);
  const start = JulianDate.fromIso8601("2020-03-09T23:10:00Z");
  const stop = JulianDate.addSeconds(start, totalSeconds, new JulianDate());

  const positionProperty = new SampledPositionProperty();
  //console.log(gpsData);

  useEffect(() => {
    createWorldTerrainAsync({
      url: IonResource.fromAssetId(1),
      requestWaterMask: true, // required for water effects
      requestVertexNormals: true // required for terrain lighting
    }).then(tp => setTerrainProvider(tp));

    createOsmBuildingsAsync().then(buildings => setOsmBuildings(buildings));
  }, []);

  if (!terrainProvider || !osmBuildings) {
    return null; // or a loading spinner
  }

  async function getHeight() {
    try {
      var samples = await sampleTerrain(terrainProvider, 11, [Cartographic.fromDegrees(parseFloat(gpsData[0].longitude), parseFloat(gpsData[0].latitude))]);
      return samples[0].height;

    } catch (error) {
      console.log(error);
    }
  }
  // getHeight().then(function(height) {
  //   if (height == null) {
  //     height = 0;
  //     console.error("Failed to retrieve height.");
  //   }
  //   else {
  //     console.log("HI IT WORKS")
  //   }

  // });

  const flightData = gpsData.map(async (item, index) => {
    // Declare the time for this individual sample and store it in a new JulianDate instance.
    const time = JulianDate.addSeconds(start, index * timeStepInSeconds, new JulianDate());

    const position = Cartesian3.fromDegrees(item.longitude, item.latitude, item.height + await getHeight());
    console.log(position)
    //console.log(position.toString())
    // Store the position along with its timestamp.
    // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
    positionProperty.addSample(time, position);
    return (
      <Entity
        key={index}
        position={position}
        heightReference={HeightReference.RELATIVE_TO_GROUND}
        point={{ pixelSize: '4', color: Color.RED }}
      />
    );
  });

  console.log(await flightData)


  const droneLine = <Entity
    availability={new TimeIntervalCollection([new TimeInterval({ start: start, stop: stop })])}
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
  />

  return (
    <Viewer terrainProvider={terrainProvider}>
      <Clock
        startTime={start.clone()}
        stopTime={stop.clone()}
        currentTime={start.clone()}
        multiplier={50}
        shouldAnimate={true}>
        {flightData}
        {droneLine}
      </Clock>
    </Viewer>
  );
};

export default DroneFlightPath;