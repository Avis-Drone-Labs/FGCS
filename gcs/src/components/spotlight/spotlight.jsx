/*
  The spotlight component, a way of searching and navigating through FGCS via keyboard
*/

// Native imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Button } from "@mantine/core"
import { Spotlight, spotlight } from "@mantine/spotlight"
import { IconSearch } from "@tabler/icons-react"

// Local imports
import { actions } from "./actions"
import kbdBadge from "./badges"

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
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    window.ipcRenderer.invoke("isMac").then((result) => {
      setIsMac(result)
    })
  }, [])

  // Spotlight searching
  const [query, setQuery] = useState("")
  const items = actions
    .filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .map((item) => (
      <div key={item.id}>
        {/* Separator that shows up if the last item was of type page and this item is a command */}
        {actions.indexOf(item) > 0 &&
          item.type == "command" &&
          actions[actions.indexOf(item) - 1].type == "page" && (
            <hr key="separator" className="border-falcongrey-600 m-2" />
          )}

        {/* Spotlight action */}
        <Spotlight.Action
          key={item.id}
          label={item.label}
          onClick={item.command}
          rightSection={
            isMac && item.macRightSection
              ? item.macRightSection
              : item.rightSection
          }
          color="red"
          classNames={{
            action: "data-[selected]:!bg-falcongrey-700 max-h-8",
          }}
        />
      </div>
    ))

  return (
    <>
      {/* Search button */}
      <Button
        radius="sm"
        color={tailwindColors.falcongrey[900]}
        rightSection={kbdBadge(isMac ? "⌘ + K" : "Ctrl + K")}
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
            <Spotlight.Empty>No command found...</Spotlight.Empty>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  )
}
