/**
 * Contains preset filter configurations for Flight Log Analyzer (FLA) based on log file type.
 * Manages both built-in and custom presets for dataflash and FGCS telemetry logs.
 * Includes hooks and utilities for saving, loading, and managing custom presets in localStorage.
 *
 * @module
 * @returns {Object} Hook functions and data:
 *   - presetCategories: Object containing all preset categories
 *   - saveCustomPreset: Function to save a new custom preset
 *   - deleteCustomPreset: Function to remove a custom preset
 *   - findExistingPreset: Function to check for duplicate presets
 */
import { useState, useEffect } from "react"
import _ from "lodash"

const dataflashPresetCategories = [
  {
    name: "Speed",
    filters: [
      {
        name: "Ground Speed vs Air Speed",
        filters: { GPS: ["Spd"], ARSP: ["Airspeed"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
    ],
  },
  {
    name: "Attitude",
    filters: [
      {
        name: "Desired Roll vs Achieved Roll",
        filters: { ATT: ["DesRoll", "Roll"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
      {
        name: "Desired Pitch vs Achieved Pitch",
        filters: { ATT: ["DesPitch", "Pitch"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
      {
        name: "Desired Yaw vs Achieved Yaw",
        filters: { ATT: ["DesYaw", "Yaw"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
    ],
  },
  {
    name: "Vibration",
    filters: [
      {
        name: "Vibration XYZ",
        filters: { VIBE: ["VibeX", "VibeY", "VibeZ"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
    ],
  },
  {
    name: "Batteries",
    filters: [
      {
        name: "Battery 1 Voltage vs Current",
        filters: { BAT1: ["Volt", "Curr"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
      {
        name: "Battery 2 Voltage vs Current",
        filters: { BAT2: ["Volt", "Curr"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
      {
        name: "Battery 3 Voltage vs Current",
        filters: { BAT3: ["Volt", "Curr"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
      {
        name: "Battery 4 Voltage vs Current",
        filters: { BAT4: ["Volt", "Curr"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
    ],
  },
  {
    name: "Control Tuning",
    filters: [
      {
        name: "Desired Alt vs Achieved Alt vs Barometer Alt",
        filters: { CTUN: ["DAlt", "Alt", "BAlt"] },
        aircraftType: ["copter", "plane"],
      },
      {
        name: "Desired Rangefinder Alt vs Achieved Rangefinder Alt vs Achieved Alt",
        filters: { CTUN: ["DSAlt", "SAlt", "Alt"] },
        aircraftType: ["copter", "plane"],
      },
      {
        name: "Desired Climb Rate vs Achieved Climb Rate",
        filters: { CTUN: ["DCRt", "CRt"] },
        aircraftType: ["copter", "plane"],
      },
      {
        name: "Throttle Input vs Throttle Output",
        filters: { CTUN: ["ThI", "ThO"] },
        aircraftType: ["copter", "plane"],
      },
      {
        name: "Desired Alt vs Achieved Alt vs Barometer Alt",
        filters: { QTUN: ["DAlt", "Alt", "BAlt"] },
        aircraftType: ["quadplane"],
      },
      {
        name: "Desired Rangefinder Alt vs Achieved Rangefinder Alt vs Achieved Alt",
        filters: { QTUN: ["DSAlt", "SAlt", "Alt"] },
        aircraftType: ["quadplane"],
      },
      {
        name: "Desired Climb Rate vs Achieved Climb Rate",
        filters: { QTUN: ["DCRt", "CRt"] },
        aircraftType: ["quadplane"],
      },
      {
        name: "Throttle Input vs Throttle Output",
        filters: { QTUN: ["ThI", "ThO"] },
        aircraftType: ["quadplane"],
      },
    ],
  },
  {
    name: "RC Inputs",
    filters: [
      {
        name: "RC Inputs 1-4",
        filters: { RCIN: ["C1", "C2", "C3", "C4"] },
        aircraftType: ["copter", "plane", "quadplane"],
      },
    ],
  },
]

const fgcsTelemetryPresetCategories = [
  {
    name: "Speed",
    filters: [
      {
        name: "Ground Speed vs Air Speed",
        filters: { VFR_HUD: ["groundspeed", "airspeed"] },
      },
    ],
  },
  {
    name: "Attitude",
    filters: [
      {
        name: "Roll vs Pitch",
        filters: { ATTITUDE: ["roll", "pitch"] },
      },
    ],
  },
  {
    name: "Vibration",
    filters: [
      {
        name: "Vibration XYZ",
        filters: { VIBRATION: ["vibration_x", "vibration_y", "vibration_z"] },
      },
      {
        name: "Clipping",
        filters: { VIBRATION: ["clipping_0", "clipping_1", "clipping_2"] },
      },
    ],
  },
  {
    name: "RC Inputs",
    filters: [
      {
        name: "RC Inputs 1-4",
        filters: {
          RC_CHANNELS: ["chan1_raw", "chan2_raw", "chan3_raw", "chan4_raw"],
        },
      },
    ],
  },
]

const initialPresetCategories = {
  dataflash: dataflashPresetCategories,
  fgcs_telemetry: fgcsTelemetryPresetCategories,
  custom_dataflash: [
    {
      name: "Custom Presets",
      filters: [],
    },
  ], // New category for custom dataflash presets
  custom_fgcs_telemetry: [
    {
      name: "Custom Presets",
      filters: [],
    },
  ], // New category for custom FGCS telemetry presets
}

export function usePresetCategories() {
  const [presetCategories, setPresetCategories] = useState(
    initialPresetCategories,
  )

  useEffect(() => {
    // Load custom presets from localStorage on component mount... if they exist
    const savedCustomDataflashPresets = localStorage.getItem(
      "customDataflashPresets",
    )
    const savedCustomFgcsTelemetryPresets = localStorage.getItem(
      "customFgcsTelemetryPresets",
    )

    if (savedCustomDataflashPresets) {
      setPresetCategories((prevCategories) => ({
        ...prevCategories,
        custom_dataflash: [
          {
            name: "Custom Presets",
            filters: JSON.parse(savedCustomDataflashPresets),
          },
        ],
      }))
    }

    if (savedCustomFgcsTelemetryPresets) {
      setPresetCategories((prevCategories) => ({
        ...prevCategories,
        custom_fgcs_telemetry: [
          {
            name: "Custom Presets",
            filters: JSON.parse(savedCustomFgcsTelemetryPresets),
          },
        ],
      }))
    }
  }, [])

  function saveCustomPreset(preset, logType) {
    const categoryKey =
      logType === "dataflash" ? "custom_dataflash" : "custom_fgcs_telemetry"
    const storageKey =
      logType === "dataflash"
        ? "customDataflashPresets"
        : "customFgcsTelemetryPresets"

    setPresetCategories((prevCategories) => {
      const updatedCustomPresets = [
        ...prevCategories[categoryKey][0].filters,
        preset,
      ]
      localStorage.setItem(storageKey, JSON.stringify(updatedCustomPresets))
      return {
        ...prevCategories,
        [categoryKey]: [
          {
            name: "Custom Presets",
            filters: updatedCustomPresets,
          },
        ],
      }
    })
  }

  function deleteCustomPreset(presetName, logType) {
    const categoryKey =
      logType === "dataflash" ? "custom_dataflash" : "custom_fgcs_telemetry"
    const storageKey =
      logType === "dataflash"
        ? "customDataflashPresets"
        : "customFgcsTelemetryPresets"

    setPresetCategories((prevCategories) => {
      const updatedCustomPresets = prevCategories[
        categoryKey
      ][0].filters.filter((preset) => preset.name !== presetName)
      localStorage.setItem(storageKey, JSON.stringify(updatedCustomPresets))
      return {
        ...prevCategories,
        [categoryKey]: [
          {
            name: "Custom Presets",
            filters: updatedCustomPresets,
          },
        ],
      }
    })
  }

  function findExistingPreset(preset, logType) {
    const customCategoryKey =
      logType === "dataflash" ? "custom_dataflash" : "custom_fgcs_telemetry"

    // Check in custom presets
    const customPreset = presetCategories[customCategoryKey][0].filters.find(
      (existingPreset) =>
        existingPreset.name === preset.name ||
        _.isEqual(existingPreset.filters, preset.filters),
    )

    if (customPreset) {
      return customPreset
    }

    // Check in standard presets
    const standardCategories = presetCategories[logType] || []
    const reducedFilters = Object.fromEntries(
      Object.entries(preset.filters).filter(([, value]) => value.length > 0),
    )
    for (const category of standardCategories) {
      // Make sure category.filters exists and is an array
      if (!Array.isArray(category.filters)) {
        continue
      }

      // Check each filter in the category
      for (const existingPreset of category.filters) {
        if (
          existingPreset.name === preset.name ||
          _.isEqual(existingPreset.filters, reducedFilters)
        ) {
          return existingPreset
        }
      }
    }

    return null
  }

  return {
    presetCategories,
    saveCustomPreset,
    deleteCustomPreset,
    findExistingPreset,
  }
}
