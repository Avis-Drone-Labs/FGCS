/*
  The spotlight component, a way of searching and navigating through FGCS via keyboard
*/

// Native imports
import { useState } from "react"

// 3rd Party Imports
import { Button } from "@mantine/core"
import { Spotlight, spotlight } from "@mantine/spotlight"
import { IconSearch } from "@tabler/icons-react"

// Local imports
import { pages } from "./actions"
import kbdBadge from "./kbdBadge"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function SpotlightComponent() {
  const textColorStyle = {
    root: {
      color: "var(--mantine-text-color)",
    },
  }

  // Spotlight searching
  const [query, setQuery] = useState("")
  const items = pages
    .filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .map((item) => (
      <Spotlight.Action
        key={item.id}
        label={item.label}
        onClick={item.onClick}
        rightSection={item.rightSection}
        color="red"
        classNames={{
          action: "data-[selected]:!bg-falcongrey-700 max-h-8",
        }}
      />
    ))

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
      <Spotlight.Root query={query} onQueryChange={setQuery}>
        <Spotlight.Search
          placeholder="Search..."
          leftSection={<IconSearch stroke={1.5} />}
        />
        <Spotlight.ActionsList>
          {items.length > 0 ? (
            items
          ) : (
            <Spotlight.Empty>Nothing found...</Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  )
}
