'use client'

import Webcam from "react-webcam";
import { useSearchParams } from "react-router-dom";
import { IconX } from "@tabler/icons-react";
import { useRef } from "react";

export default function CameraWindow(){
  const [searchParams] = useSearchParams();

  const videoRef = useRef(null);
  const deviceId = searchParams.get("deviceId", null)

  return (
    <div className="w-[100%] h-[100%] overflow-hidden">
      <div
        className={"flex flex-row items-center justify-between bg-falcongrey-800 h-7 allow-drag"}
      >
        <div className="text-slate-400 px-2 whitespace-nowrap overflow-hidden text-ellipsis">{searchParams.get("deviceName")}</div>
          <button className="group px-2 no-drag hover:bg-red-500 h-[100%]" onClick={() => window.ipcRenderer.closeWebcamWindow()}>
            <IconX stroke={2} size="20px" className="stroke-slate-400 group-hover:stroke-white"/>
          </button>
      </div>
      {deviceId !== null && <Webcam audio={false} ref={videoRef} videoConstraints={{ deviceId: searchParams.get("deviceId", null)}} width={"100%"}/>}
    </div>
  )
}
