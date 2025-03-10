'use client'

import Webcam from "react-webcam";
import { useSearchParams } from "react-router-dom";
import { IconX } from "@tabler/icons-react";
import { useRef } from "react";

export default function CameraWindow(){
    const [searchParams] = useSearchParams();

    const videoRef = useRef(null);


    return (

        <div className="w-[100%] h-[100%] overflow-hidden">
            <div
                className={"flex flex-row items-center justify-between bg-falcongrey-800 h-7 allow-drag"}
            >
                <div className="text-slate-400 px-2 whitespace-nowrap overflow-hidden text-ellipsis">{searchParams.get("deviceName")}</div>
                <button className="px-2 no-drag hover:bg-falconred-950 h-[100%]" onClick={() => window.ipcRenderer.closeWebcamWindow()}>
                    <IconX stroke={2} size="20px" className="stroke-slate-400"/>
                </button>

            </div>
            <Webcam audio={false} ref={videoRef} videoConstraints={{ deviceId: searchParams.get("deviceId")}} width={"100%"}/>
        </div>
    )
}
