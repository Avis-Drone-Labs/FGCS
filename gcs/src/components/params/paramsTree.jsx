/*
  Parameter tree component for hierarchical parameter navigation.
  Splits parameter names by underscore and creates a tree structure.
*/

import { ScrollArea } from "@mantine/core"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectParams,
  setParamSearchValue,
} from "../../redux/slices/paramsSlice.js"

// Build nested tree from param names
function buildParamTree(params) {
  const root = {}

  for (const param of params) {
    const fullName = param.param_id
    const parts = fullName.split("_")
    let node = root

    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]
      if (!node[key]) {
        node[key] = {
          children: {},
          params: [],
          path: parts.slice(0, i + 1).join("_"),
        }
      }
      // Store full param at each level for filtering
      node[key].params.push(fullName)
      node = node[key].children
    }
  }

  // Convert to array structure, collapsing single-child nodes
  function convert(obj) {
    return Object.keys(obj)
      .sort()
      .map((key) => {
        const entry = obj[key]
        let path = entry.path
        let label = key
        let children = entry.children

        // Collapse single-child parents
        while (Object.keys(children).length === 1) {
          const childKey = Object.keys(children)[0]
          const childEntry = children[childKey]
          label = `${label}_${childKey}`
          path = childEntry.path
          children = childEntry.children
        }

        const hasChildren = Object.keys(children).length > 0

        return {
          key: path,
          label: label,
          path: path,
          children: hasChildren ? convert(children) : [],
          paramCount: entry.params.length,
        }
      })
  }

  return convert(root)
}

function TreeNode({ node, expanded, onToggle, onSelect, level = 0 }) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.key)
  const paddingLeft = level * 16 + 8

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-falcongrey-700 text-sm"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {hasChildren ? (
          <span
            className="flex-shrink-0 w-4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.key)
            }}
          >
            {isExpanded ? (
              <IconChevronDown size={18} />
            ) : (
              <IconChevronRight size={18} />
            )}
          </span>
        ) : (
          <span className="flex-shrink-0 w-4" />
        )}
        <span
          className="truncate flex-1 cursor-pointer"
          title={node.path}
          onClick={() => onSelect(node.path)}
        >
          {node.label}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          ({node.paramCount})
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ParamsTree() {
  const dispatch = useDispatch()
  const params = useSelector(selectParams)

  const [expanded, setExpanded] = useState(new Set(["all"]))

  // Build tree from params
  const treeData = useMemo(() => {
    if (!params || params.length === 0) return []
    return buildParamTree(params)
  }, [params])

  // Create "All" root node with all params as children
  const allNode = useMemo(() => {
    return {
      key: "all",
      label: "All",
      path: "",
      children: treeData,
      paramCount: params.length,
    }
  }, [params.length, treeData])

  function handleToggle(key) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleSelect(path) {
    // Set the main search bar to filter by this path
    dispatch(setParamSearchValue(path))
  }

  if (!params || params.length === 0) {
    return <div className="p-4 text-sm text-gray-400">No parameters loaded</div>
  }

  return (
    <ScrollArea.Autosize
      className="h-full flex flex-col px-4"
      type="always"
      offsetScrollbars
    >
      <TreeNode
        node={allNode}
        expanded={expanded}
        onToggle={handleToggle}
        onSelect={handleSelect}
        level={0}
      />
    </ScrollArea.Autosize>
  )
}
