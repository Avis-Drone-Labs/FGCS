/*
  Graphs menu button and dropdown, this is for the toolbar.
*/

import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import MenuTemplate from "./menuTemplate"
import Divider from "./divider"

import { mavlinkMsgParams } from "../../../helpers/mavllinkDataStreams"

import {
  selectGraphValues,
  setGraphValues,
} from "../../../redux/slices/droneInfoSlice"
import { Checkbox } from "@mantine/core"
import { TextInput } from "@mantine/core"

const MAX_SELECTED = 4

const GRAPH_KEYS = ["graph_a", "graph_b", "graph_c", "graph_d"]

function MenuCheckboxItem({label, title, checked, disabled, onToggle}) {
  return (
    <div
    className="flex flex-row w-full gap-x-3 justify-between rounded-md px-3 text-sm"
    title={title}
    >
      <Checkbox
      className="min-w-0"
      label={label}
      checked={checked}
      disabled={disabled}
      onChange={() => onToggle()}
      />

      <div className="text-falcongrey-300 opacity-50" />
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <div className="px-3 pt-1 pb-0.5 text-xs text-falcongrey-300 opacity-60">
      {title}
    </div>
  )
}

function sortKeysAlphabetically(obj) {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b))
}

// Build a nice meta payload for the popout window from an id like "ATTITUDE.pitch"
function buildMetaFromId(id) {
  if (!id) return null
  const [msg, field] = id.split(".")
  const desc = mavlinkMsgParams?.[msg]?.[field] ?? ""
  return {
    id,
    msg,
    field,
    title: `${msg}.${field}`,
    description: desc,
    // label appears on the graph dataset; keep it readable
    label: desc ? `${field} — ${desc}` : field,
  }
}

export default function GraphsMenu(props) {
  const dispatch = useDispatch()

  useEffect(() => {
    // Reset graph selections on mount to prevent old graph selection persisting.
    dispatch(
      setGraphValues({
        graph_a: null,
        graph_b: null,
        graph_c: null,
        graph_d: null,
      }),
    )
  }, [dispatch])

  //Redux graph slots (graph_a..graph_d -> "MSG.FIELD" | null)
  const selectedGraphs = useSelector(selectGraphValues)

  const [query, setQuery] = useState("")

  // ordered list from slots (graph_a then b then c then d)
  const selectedList = GRAPH_KEYS.map((k) => selectedGraphs?.[k]).filter(
    Boolean,
  )

  const selectedCount = selectedList.length

  // Filter groups/fields by query across msg / field / description
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const msgs = sortKeysAlphabetically(mavlinkMsgParams)

    if (!q) {
      return msgs.map((msg) => ({
        msg,
        fields: sortKeysAlphabetically(mavlinkMsgParams[msg]),
      }))
    }

    const out = []
    for (const msg of msgs) {
      const msgMatches = msg.toLowerCase().includes(q)
      const fields = sortKeysAlphabetically(mavlinkMsgParams[msg]).filter((field) => {
        if (msgMatches) return true
        const desc = mavlinkMsgParams[msg][field] ?? ""
        return (
          field.toLowerCase().includes(q) ||
          String(desc).toLowerCase().includes(q)
        )
      })
      if (fields.length) out.push({ msg, fields })
    }
    return out
  }, [query])

  // Pack ordered list into slots graph_a..d
  const packToSlots = (list) => {
    const next = { graph_a: null, graph_b: null, graph_c: null, graph_d: null }
    for (let i = 0; i < Math.min(list.length, MAX_SELECTED); i++) {
      next[GRAPH_KEYS[i]] = list[i]
    }
    return next
  }

  const safeInvoke = (channel, payload) => {
    try {
      return window.ipcRenderer.invoke(channel, payload)
    } catch (err) {
      console.error("[IPC invoke failed]", channel, err)
      return Promise.resolve(null)
    }
  }

  const syncWindowsForSlots = (beforeSlots, afterSlots) => {
    for (const key of GRAPH_KEYS) {
      const before = beforeSlots?.[key] ?? null
      const after = afterSlots?.[key] ?? null

      if (after && after !== before) {
        const meta = buildMetaFromId(after)
        safeInvoke("app:open-graph-window", { graphKey: key, meta })
        continue
      }

      if (!after && before) {
        safeInvoke("app:close-graph-window", { graphKey: key })
      }
    }
  }

  const toggle = (id) => {
    const beforeSlots = selectedGraphs

    // remove if already selected
    if (selectedList.includes(id)) {
      const nextList = selectedList.filter((x) => x !== id)
      const afterSlots = packToSlots(nextList)

      dispatch(setGraphValues(afterSlots))
      syncWindowsForSlots(beforeSlots, afterSlots)
      return
    }

    // add if room
    if (selectedList.length >= MAX_SELECTED) return

    const nextList = [...selectedList, id]
    const afterSlots = packToSlots(nextList)

    dispatch(setGraphValues(afterSlots))
    syncWindowsForSlots(beforeSlots, afterSlots)
  }

  return (
    <MenuTemplate
      title="Graphs"
      areMenusActive={props.areMenusActive}
      setMenusActive={props.setMenusActive}
    >
      <div
        className="flex flex-col min-w-72"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {/* Search */}
        <div className="px-2 py-1">
          <TextInput
            placeholder="Search MAVLink fields…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onClick={(e) => e.stopPropagation()}
            size="xs"
          />
        </div>

        <Divider />

        {/* Scrollable list */}
        <div className="max-h-96 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="px-3 py-2 text-sm text-falcongrey-300 opacity-60">
              No matches
            </div>
          ) : (
            filteredGroups.map((group, idx) => (
              <div key={group.msg}>
                <SectionHeader title={group.msg} />

                {group.fields.map((field) => {
                  const id = `${group.msg}.${field}`
                  const desc = mavlinkMsgParams[group.msg][field]
                  const checked = selectedList.includes(id)
                  const disabled = !checked && selectedCount >= MAX_SELECTED

                  return (
                    <MenuCheckboxItem
                      key={id}
                      label={field}
                      title={desc}
                      checked={checked}
                      disabled={disabled}
                      onToggle={() => toggle(id)}
                    />
                  )
                })}

                {idx < filteredGroups.length - 1 ? <Divider /> : null}
              </div>
            ))
          )}
        </div>

        <div className="px-2 pb-1 flex flex-row justify-end">
          <button
            className="text-xs text-falcongrey-300 opacity-70 hover:opacity-100 hover:underline"
            onClick={(e) => {
              e.stopPropagation()

              const cleared = {
                graph_a: null,
                graph_b: null,
                graph_c: null,
                graph_d: null,
              }
              dispatch(setGraphValues(cleared))
              // close any open windows too
              for (const key of ["graph_a", "graph_b", "graph_c", "graph_d"]) {
                safeInvoke("app:close-graph-window", { graphKey: key }).catch(
                  console.error,
                )
              }
            }}
          >
            Clear
          </button>
        </div>

        {/* Counter */}
        <div className="px-3 pt-1 text-xs text-falcongrey-300 opacity-50">
          {selectedCount}/{MAX_SELECTED} selected
        </div>
      </div>
    </MenuTemplate>
  )
}
