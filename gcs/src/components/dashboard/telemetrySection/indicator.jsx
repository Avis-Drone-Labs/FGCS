/*
  Indicator Component for dashboard. This is the component that shows orientation of the drone.
*/

// Image imports
import heading_mechanics from "../../img/heading_mechanics.svg"
import heading_yaw from "../../img/heading_yaw.svg"
import horizon_back from "../../img/horizon_back.svg"
import horizon_ball from "../../img/horizon_ball.svg"
import horizon_circle from "../../img/horizon_circle.svg"
import horizon_mechanics from "../../img/horizon_mechanics.svg"

// File constants
const constants = {
  pitch_bound: 30,
}

const box = {
  width: "100%",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,

  // Stops dragging
  "WebkitUserDrag": "none",
}

// Custom instrument styling for each indicator below
const Instrument = ({ children, size }) => {
  return (
    <div
      className="relative inline-block overflow-hidden"
      style={{
        height: size ?? "250px",
        width: size ?? "250px",
        clipPath: "circle(36.66% at center)",
      }}
    >
      {children}
    </div>
  )
}

// Attitude component to show stats below the heading indicator
export const AttitudeIndicator = (params) => {
  let pitch = params.pitch ?? 0
  if (pitch > constants.pitch_bound) {
    pitch = constants.pitch_bound
  } else if (pitch < -constants.pitch_bound) {
    pitch = -constants.pitch_bound
  }

  return (
    <Instrument {...params}>
      <div
        className="roll box"
        style={{
          ...box,
          top: "0%",
          transform: `rotate(${-(params.roll ?? 0)}deg)`,
        }}
      >
        <img src={horizon_back} className="box" alt="" style={{ ...box }} />
        <div className="pitch box" style={{ ...box, top: `${pitch * 0.7}%` }}>
          <img src={horizon_ball} className="box" style={box} alt="" />
        </div>
        <img src={horizon_circle} className="box" style={box} alt="" />
      </div>
      <div className="mechanics box" style={box}>
        <img src={horizon_mechanics} className="box" style={box} alt="" />
      </div>
    </Instrument>
  )
}

// Heading indicator for the drones yaw
export const HeadingIndicator = (params) => {
  return (
    <Instrument {...params}>
      <div
        className="heading box"
        style={{ ...box, transform: `rotate(${-(params.heading ?? 0)}deg)` }}
      >
        <img src={heading_yaw} className="box" style={box} alt="" />
      </div>
      <div className="mechanics box" style={box}>
        <img src={heading_mechanics} className="box" style={box} alt="" />
      </div>
    </Instrument>
  )
}
