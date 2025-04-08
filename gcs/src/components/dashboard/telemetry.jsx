/*
  Telemetry. This file holds all the telemetry indicators and is part of the resizable info box
  section, found in the top half.
*/

// Custom Components
import { useSelector } from "react-redux"
import { AttitudeIndicator, HeadingIndicator } from "./indicator"
import TelemetryValueDisplay from "./telemetryValueDisplay"
import { selectAlt, selectArmed, selectAttitudeDeg, selectFlightMode, selectHeading, selectNavController, selectPrearmEnabled, selectSystemStatus, selectTelemetry } from "../../redux/slices/droneInfoSlice"

export default function TelemetrySection({
  calcIndicatorSize,
  calcIndicatorPadding,
  telemetryFontSize,
  sideBarRef,
  batteryData,
}) {

  const isArmed = useSelector(selectArmed);
  const heading = useSelector(selectHeading);
  const {yaw} = useSelector(selectAttitudeDeg);
  const flightMode = useSelector(selectFlightMode);
  const {alt, relativeAlt} = useSelector(selectAlt)
  const { wpDist } = useSelector(selectNavController);
  const systemStatus = useSelector(selectSystemStatus);
  const prearmEnabled = useSelector(selectPrearmEnabled);
  const {airspeed, groundspeed} = useSelector(selectTelemetry);

  return (
    <div>
      {/* Information above indicators */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-3">
          {isArmed ? (
            <p className="font-bold text-falconred">ARMED</p>
          ) : (
            <>
              <p className="font-bold">DISARMED</p>
              {prearmEnabled? (
                <p className="text-green-500">Prearm: Enabled</p>
              ) : (
                <p className="font-bold text-falconred">Prearm: Disabled</p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-row space-x-6">
          <p>{systemStatus}</p>
          <p>{flightMode}</p>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex items-center flex-col justify-evenly @xl:flex-row">
        {/* Attitude Indicator */}
        <div
          className="flex flex-row items-center justify-center"
          style={{
            paddingTop: `${calcIndicatorPadding()}px`,
            paddingBottom: `${calcIndicatorPadding()}px`,
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center min-w-14">
            {/* AS and GS values */}
            <p className="text-sm text-center">ms&#8315;&#185;</p>
            <TelemetryValueDisplay
              title="AS"
              value={airspeed.toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="GS"
              value={groundspeed.toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>

          {/* Attitude indicator image */}
          <AttitudeIndicator
            size={`${calcIndicatorSize()}px`}
          />

          {/* AMSL and AREL values */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center min-w-14">
            <p className="text-sm text-center">m</p>
            <TelemetryValueDisplay
              title="AMSL"
              value={alt.toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="AREL"
              value={relativeAlt.toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>
        </div>

        {/* Heading Indicator */}
        <div
          className="flex flex-row items-center justify-center"
          style={{
            paddingTop: `${calcIndicatorPadding()}px`,
            paddingBottom: `${calcIndicatorPadding()}px`,
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center min-w-14">
            {/* HDG and WP values */}
            <p className="text-sm text-center">deg &#176;</p>
            <TelemetryValueDisplay
              title="HDG"
              value={heading.toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="YAW"
              value={yaw.toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>

          {/* Heading indicator image */}
          <HeadingIndicator
            size={`${calcIndicatorSize()}px`}
          />

          {/* YAW and HOME values */}
          <div
            className="flex flex-col items-center justify-center space-y-4 text-center min-w-14"
            ref={sideBarRef}
          >
            <p className="text-sm">m</p>
            <TelemetryValueDisplay
              title="WP"
              value={wpDist.toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="HOME"
              value={(0).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>
        </div>
      </div>

      {/* Battery information */}
      <div className="flex flex-col items-center">
        <p>BATTERY</p>

        <table>
          <tbody>
            {batteryData.map(battery => (
              <tr className="w-full" key={battery.id}>
                <td className="px-4">BATTERY{battery.id}</td>
                <td className="font-bold px-2 text-xl text-right">
                  {(battery.voltages
                    ? battery.voltages[0] / 1000
                    : 0
                  ).toFixed(2)}
                  V
                </td>
                <td className="font-bold px-2 text-xl text-right">
                  {(battery.current_battery
                    ? battery.current_battery / 100
                    : 0
                  ).toFixed(2)}
                  A
                </td>
                <td className="font-bold px-2 text-xl text-right">
                  {battery.battery_remaining ? battery.battery_remaining : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
