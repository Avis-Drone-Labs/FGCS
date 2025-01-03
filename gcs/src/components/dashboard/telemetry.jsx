/*
  Telemetry. This file holds all the telemetry indicators and is part of the resizable info box 
  section, found in the top half.
*/

// Custom Components
import { AttitudeIndicator, HeadingIndicator } from './indicator'
import TelemetryValueDisplay from './telemetryValueDisplay'

export default function TelemetrySection({
  getIsArmed,
  prearmEnabled,
  calcIndicatorSize,
  calcIndicatorPadding,
  getFlightMode,
  telemetryData,
  telemetryFontSize,
  attitudeData,
  gpsData,
  sideBarRef,
  navControllerOutputData,
  batteryData,
  systemStatus,
}) {
  return (
    <div>
      {/* Information above indicators */}
      <div className='flex flex-col items-center space-y-2'>
        {getIsArmed() ? (
          <p className='font-bold text-falconred'>ARMED</p>
        ) : (
          <>
            <p className='font-bold'>DISARMED</p>
            {prearmEnabled() ? (
              <p className='text-green-500'>Prearm: Enabled</p>
            ) : (
              <p className='font-bold text-falconred'>Prearm: Disabled</p>
            )}
          </>
        )}
        <div className='flex flex-row space-x-6'>
          <p>{systemStatus}</p>
          <p>{getFlightMode()}</p>
        </div>
      </div>

      {/* Indicators */}
      <div className='flex items-center flex-col justify-center justify-evenly @xl:flex-row'>
        {/* Attitude Indicator */}
        <div
          className='flex flex-row items-center justify-center'
          style={{
            paddingTop: `${calcIndicatorPadding()}px`,
            paddingBottom: `${calcIndicatorPadding()}px`,
          }}
        >
          <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
            <p className='text-sm text-center'>ms&#8315;&#185;</p>
            <TelemetryValueDisplay
              title='AS'
              value={(telemetryData.airspeed
                ? telemetryData.airspeed
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title='GS'
              value={(telemetryData.groundspeed
                ? telemetryData.groundspeed
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>
          <AttitudeIndicator
            roll={attitudeData.roll * (180 / Math.PI)}
            pitch={attitudeData.pitch * (180 / Math.PI)}
            size={`${calcIndicatorSize()}px`}
          />
          <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
            <p className='text-sm text-center'>m</p>
            <TelemetryValueDisplay
              title='AMSL'
              value={(gpsData.alt ? gpsData.alt / 1000 : 0).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title='AREL'
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
          className='flex flex-row items-center justify-center'
          style={{
            paddingTop: `${calcIndicatorPadding()}px`,
            paddingBottom: `${calcIndicatorPadding()}px`,
          }}
        >
          <div className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'>
            <p className='text-sm text-center'>deg &#176;</p>
            <TelemetryValueDisplay
              title='HDG'
              value={(gpsData.hdg ? gpsData.hdg / 100 : 0).toFixed(2)}
              fs={telemetryFontSize}
            />
            <TelemetryValueDisplay
              title='YAW'
              value={(attitudeData.yaw
                ? attitudeData.yaw * (180 / Math.PI)
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>
          <HeadingIndicator
            heading={gpsData.hdg ? gpsData.hdg / 100 : 0}
            size={`${calcIndicatorSize()}px`}
          />
          <div
            className='flex flex-col items-center justify-center space-y-4 text-center min-w-14'
            ref={sideBarRef}
          >
            <p className='text-sm'>m</p>
            <TelemetryValueDisplay
              title='WP'
              value={(navControllerOutputData.wp_dist
                ? navControllerOutputData.wp_dist
                : 0
              ).toFixed(2)}
              fs={telemetryFontSize}
            />
            {/* TOOD: Implement distance to home */}
            <TelemetryValueDisplay
              title='HOME'
              value={(0).toFixed(2)}
              fs={telemetryFontSize}
            />
          </div>
        </div>
      </div>

      {/* Batter information */}
      <div className='flex flex-col items-center'>
        <p>BATTERY</p>
        <div className='flex flex-row space-x-4'>
          <p className='font-bold text-xl'>
            {(batteryData.voltages
              ? batteryData.voltages[0] / 1000
              : 0
            ).toFixed(2)}
            V
          </p>
          <p className='font-bold text-xl'>
            {(batteryData.current_battery
              ? batteryData.current_battery / 100
              : 0
            ).toFixed(2)}
            A
          </p>
          <p className='font-bold text-xl'>
            {batteryData.battery_remaining ? batteryData.battery_remaining : 0}%
          </p>
        </div>
      </div>
    </div>
  )
}
