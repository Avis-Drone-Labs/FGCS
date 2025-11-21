/*
  Custom mantine colour theme using tailwind colours
*/

// 3rd Party imports
import { createTheme } from "@mantine/core"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors
export const CustomMantineTheme = createTheme({
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;",
  lineHeights: "1.5",
  colors: {
    dark: [
      tailwindColors.falcongrey[100],
      tailwindColors.falcongrey[200],
      tailwindColors.falcongrey[300],
      tailwindColors.falcongrey[400],
      tailwindColors.falcongrey[500],
      tailwindColors.falcongrey[600],
      tailwindColors.falcongrey[700],
      tailwindColors.falcongrey[800],
      tailwindColors.falcongrey[900],
      tailwindColors.falcongrey[950],
    ],
    red: [
      tailwindColors.falconred[100],
      tailwindColors.falconred[200],
      tailwindColors.falconred[300],
      tailwindColors.falconred[400],
      tailwindColors.falconred[500],
      tailwindColors.falconred[600],
      tailwindColors.falconred[700],
      tailwindColors.falconred[800],
      tailwindColors.falconred[900],
      tailwindColors.falconred[950],
    ],
  },
  cursorType: "pointer",
})
