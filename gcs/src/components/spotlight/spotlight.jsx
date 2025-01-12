/*
  The spotlight component, a way of searching and navigating through FGCS via keyboard
*/

// 3rd Party Imports
import { rem, Button, Badge  } from "@mantine/core"
import { Spotlight, spotlight } from '@mantine/spotlight';
import { IconSearch } from "@tabler/icons-react"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const actions = [
  {
    group: "Pages",
    actions: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        onClick: () => console.log('Dashboard spotlight button clicked!'),
      },
      {
        id: 'graphs',
        label: 'Graphs',
        onClick: () => console.log('Graphs spotlight button clicked!'),
      },
      {
        id: 'params',
        label: 'Params',
        onClick: () => console.log('Params spotlight button clicked!'),
      },
      {
        id: 'config',
        label: 'Config',
        onClick: () => console.log('Config spotlight button clicked!'),
      },
      {
        id: 'fla',
        label: 'FLA',
        onClick: () => console.log('FLA spotlight button clicked!'),
      },
    ]
  },
  {
    group: "Actions",
    actions: [
      {id: "refresh", label: "Force refresh page"}
    ]
  }
];

export default function SpotlightComponent() {
  const textColorStyle = {
    root: {
      color: "var(--mantine-text-color)"
    }
  }

  function kbdBadge(text, isSmall) {
    return (
      <Badge 
        color={tailwindColors.falcongrey[700]} 
        radius="xs" 
        size="xs"
        styles={textColorStyle}
      >
        {text}
      </Badge >
    )
  }

  return (
    <>
      {/* Search button */}
      <Button 
        radius="sm"
        color={tailwindColors.falcongrey[900]}
        rightSection={kbdBadge("Ctrl + K")}
        fullWidth
        justify="space-between"
        styles={textColorStyle}
        onClick={spotlight.open}
        className="!h-[30px] focus:!outline-none"
      >
        <IconSearch size={14} className="mr-4" /> Search
      </Button>

      {/* Spotlight popup */}
      <Spotlight
        actions={actions}
        nothingFound="Nothing found..."
        highlightQuery
        searchProps={{
          leftSection: <IconSearch style={{ width: rem(20), height: rem(20) }} stroke={1.5} />,
          placeholder: 'Search...',
        }}
      />
    </>
  )
}