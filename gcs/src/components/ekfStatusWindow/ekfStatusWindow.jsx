"use client"

import { useEffect, useState } from "react"

export default function EkfStatusWindow() {
  const [ekfStatus, setEkfStatus] = useState({
    airspeed_variance: 0,
    compass_variance: 0,
    pos_horiz_variance: 0,
    pos_vert_variance: 0,
    terrain_alt_variance: 0,
    velocity_variance: 0,
    flags: 0,
  })

  useEffect(() => {
    window.ipcRenderer.on("app:send-ekf-status", (_event, status) => {
      setEkfStatus(status)
    })
  }, [])

  return (
    <div className="w-full h-full bg-falcongrey-800">
      <div
        className={
          "flex flex-col items-center justify-between w-full h-full gap text-center p-4"
        }
      >
        <h1 className="text-2xl font-bold text-white mb-4">EKF Status</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Airspeed Variance
            </h2>
            <p className="text-white">{ekfStatus.airspeed_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Compass Variance
            </h2>
            <p className="text-white">{ekfStatus.compass_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Position Horizontal Variance
            </h2>
            <p className="text-white">{ekfStatus.pos_horiz_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Position Vertical Variance
            </h2>
            <p className="text-white">{ekfStatus.pos_vert_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Terrain Altitude Variance
            </h2>
            <p className="text-white">{ekfStatus.terrain_alt_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">
              Velocity Variance
            </h2>
            <p className="text-white">{ekfStatus.velocity_variance}</p>
          </div>
          <div className="bg-falcongrey-700 p-4 rounded-lg col-span-2">
            <h2 className="text-lg font-semibold text-white mb-2">Flags</h2>
            <p className="text-white">{ekfStatus.flags}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
