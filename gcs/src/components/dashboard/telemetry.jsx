/*
  Telemetry. This file holds all the telemetry indicators and is part of the resizable info box
  section, found in the top half.
*/

// Custom Components
import { MAV_STATE } from "../../helpers/mavlinkConstants"
import { AttitudeIndicator, HeadingIndicator } from "./indicator"
import TelemetryValueDisplay from "./telemetryValueDisplay"

// Redux
import { useSelector } from "react-redux"
import {
  selectArmed,
  selectAttitude,
  selectBatteryData,
  selectFlightModeString,
  selectGPS,
  selectHeartbeat,
  selectNavController,
  selectPrearmEnabled,
  selectTelemetry,
} from "../../redux/slices/droneInfoSlice"
import EkfDisplay from "./ekfDisplay"
import VibeDisplay from "./vibeDisplay"

export default function TelemetrySection({
  calcIndicatorSize,
  calcIndicatorPadding,
  telemetryFontSize,
  sideBarRef,
}) {
  const prearmEnabled = useSelector(selectPrearmEnabled)
  const flightMode = useSelector(selectFlightModeString)
  const gpsData = useSelector(selectGPS)
  const isArmed = useSelector(selectArmed)
  const telemetryData = useSelector(selectTelemetry)
  const attitudeData = useSelector(selectAttitude)
  const navControllerOutputData = useSelector(selectNavController)
  const batteryData = useSelector(selectBatteryData)
  const heartbeatData = useSelector(selectHeartbeat)
  const systemStatus = MAV_STATE[heartbeatData.systemStatus]

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
              {prearmEnabled ? (
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
              value={(telemetryData.airspeed
                ? telemetryData.airspeed
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="GS"
              value={(telemetryData.groundspeed
                ? telemetryData.groundspeed
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>

          {/* Attitude indicator image */}
          <AttitudeIndicator
            roll={attitudeData.roll * (180 / Math.PI)}
            pitch={attitudeData.pitch * (180 / Math.PI)}
            size={`${calcIndicatorSize()}px`}
          />

          {/* AMSL and AREL values */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center min-w-14">
            <p className="text-sm text-center">m</p>
            <TelemetryValueDisplay
              title="AMSL"
              value={(gpsData.alt ? gpsData.alt / 1000 : 0).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="AREL"
              value={(gpsData.relative_alt
                ? gpsData.relative_alt / 1000
                : 0
              ).toFixed(2)}
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
              value={(gpsData.hdg ? gpsData.hdg / 100 : 0).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title="YAW"
              value={(attitudeData.yaw
                ? attitudeData.yaw * (180 / Math.PI)
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>

          {/* Heading indicator image */}
          <HeadingIndicator
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
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
              value={(navControllerOutputData.wp_dist
                ? navControllerOutputData.wp_dist
                : 0
              ).toFixed(2)}
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

      {/* EKF and VIBE labels */}
      <div className="flex flex-row items-center justify-center gap-10 my-4">
        <EkfDisplay telemetryFontSize={telemetryFontSize} />
        <VibeDisplay telemetryFontSize={telemetryFontSize} />
      </div>

      {/* Battery information */}
      {batteryData.length > 0 && (
        <div className="flex flex-col items-center my-4">
          <table>
            <tbody>
              {batteryData.map((battery) => (
                <tr className="w-full" key={battery.id}>
                  <td className="px-4">BATTERY{batteryData.length > 1 && battery.id}</td>
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
      )}
    </div>
  )
}
