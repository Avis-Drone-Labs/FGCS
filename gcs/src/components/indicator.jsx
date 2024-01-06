import fi_circle from './img/fi_circle.svg'
import horizon_back from './img/horizon_back.svg'
import horizon_ball from './img/horizon_ball.svg'
import horizon_circle from './img/horizon_circle.svg'
import horizon_mechanics from './img/horizon_mechanics.svg'

const constants = {
  pitch_bound: 30,
}

const box = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
}

const Instrument = ({ children, size }) => {
  return (
    <div
      className="instrument heading"
      style={{
        height: size ?? '250px',
        width: size ?? '250px',
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

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
          top: '0%',
          transform: `rotate(${params.roll ?? 0}deg)`,
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
        <img src={fi_circle} className="box" style={box} alt="" />
      </div>
    </Instrument>
  )
}
