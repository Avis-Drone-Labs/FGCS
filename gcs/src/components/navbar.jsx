/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this
  is where it is loaded. This also handles the connections to the drone as this is always loaded,
  in the future we may change this so that its loaded in its own component.
*/

import Drone from "../components/dashboard/drone.jsx";

// Base imports
import { Link } from "react-router-dom"

import {
    connected,
    connectedToSocket,
} from "../helpers/droneUtils.js"

// Third party imports
import {
  Button,
  Tooltip,
} from "@mantine/core"

import {useSessionStorage} from "@mantine/hooks"

// Helper imports
import { IconAlertTriangle } from "@tabler/icons-react"

// Styling imports
import { twMerge } from "tailwind-merge"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {

  const [outOfDate] = useSessionStorage({ key: "outOfDate" })

  const linkClassName =
    "text-md px-2 rounded-sm outline-none focus:text-falconred-400 hover:text-falconred-400 transition-colors delay-50"

  return (
    <div className="flex flex-row items-center justify-center py-2 px-2 bg-falcongrey-900">
      <Drone />
      <div className="w-full flex justify-between gap-x-4 xl:grid xl:grid-cols-2 xl:gap-0">
          <div className="flex items-center wrap">
            {/* Navigation */}
            <Link
              to="/"
              className={twMerge(
                linkClassName,
                currentPage === "dashboard" && "text-falconred font-bold",
              )}
            >
              Dashboard
            </Link>
            <Link
              to="/missions"
              className={twMerge(
                linkClassName,
                currentPage === "missions" && "text-falconred font-bold",
              )}
            >
              Missions
            </Link>
            <Link
              to="/graphs"
              className={twMerge(
                linkClassName,
                currentPage === "graphs" && "text-falconred font-bold",
              )}
            >
              Graphs
            </Link>
            <Link
              to="/params"
              className={twMerge(
                linkClassName,
                currentPage === "params" && "text-falconred font-bold",
              )}
            >
              Params
            </Link>
            <Link
              to="/config"
              className={twMerge(
                linkClassName,
                currentPage === "config" && "text-falconred font-bold",
              )}
            >
              Config
            </Link>
            <Link
              to="/fla"
              className={twMerge(
                linkClassName,
                currentPage === "fla" && "text-falconred font-bold",
              )}
            >
              FLA
            </Link>
          </div>

          {/* Right hand side information */}
          <div className="!ml-auto flex flex-row space-x-4 items-center">
            {/* Out of date warning */}
            {outOfDate && (
              <a
                href="https://github.com/Avis-Drone-Labs/FGCS/releases"
                target="_blank"
                className="flex flex-row gap-2 text-red-400 hover:text-red-600"
              >
                <IconAlertTriangle /> FGCS out of date
              </a>
            )}

            {/* Connected to message */}
            <p>
              {connected && (
                <>
                  Connected to
                  <span className="inline font-bold">
                    {
                      {
                        [ConnectionType.Serial]: ` ${selectedComPort}`,
                        [ConnectionType.Network]: ` ${networkType}:${ip}:${port}`,
                      }[connectionType]
                    }
                  </span>
                </>
              )}
            </p>

            {/* Button to connect to drone */}
            {connectedToSocket ? (
              <Button
                onClick={connected ? disconnect : connectToDroneFromButton}
                color={
                  connected
                    ? tailwindColors.falconred[800]
                    : tailwindColors.green[600]
                }
                radius="xs"
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            ) : (
              <Tooltip label="Not connected to socket">
                <Button data-disabled onClick={(event) => event.preventDefault()}>
                  Connect
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
    </div>
  )
}