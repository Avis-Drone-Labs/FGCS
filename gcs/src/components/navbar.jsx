/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this
  is where it is loaded. This also handles the connections to the drone as this is always loaded,
  in the future we may change this so that its loaded in its own component.
*/

import Drone from "../components/dashboard/drone.jsx";

import { useDisclosure } from "@mantine/hooks";
import { useSessionStorage } from "@mantine/hooks";

import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {
  return (
     <Drone />
  )
}
