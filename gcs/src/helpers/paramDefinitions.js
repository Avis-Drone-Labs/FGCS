import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import manifest from "../../data/gen_apm_params_versions.json"
import {
  selectAircraftType,
  selectFlightSwVersion,
} from "../redux/slices/droneInfoSlice"

const paramDefinitionModules = import.meta.glob(
  "../../data/gen_apm_params_def_*_*.json",
)

function getAircraftKey(aircraftType) {
  if (aircraftType === 1) {
    return "plane"
  }

  if (aircraftType === 2) {
    return "copter"
  }

  return null
}

function parseMajorMinor(flightSwVersion) {
  const match = String(flightSwVersion || "").match(/(\d+)\.(\d+)/)
  if (!match) {
    return null
  }

  return `${match[1]}.${match[2]}`
}

function getAvailableVersions(aircraftKey) {
  if (!aircraftKey) {
    return []
  }

  const versions = manifest?.vehicles?.[aircraftKey]?.versions
  return Array.isArray(versions) ? versions : []
}

function getLatestVersion(aircraftKey) {
  if (!aircraftKey) {
    return null
  }

  return manifest?.vehicles?.[aircraftKey]?.latest || null
}

function getResolvedVersion(aircraftKey, requestedVersion) {
  const versions = getAvailableVersions(aircraftKey)
  if (versions.length === 0) {
    return null
  }

  if (requestedVersion && versions.includes(requestedVersion)) {
    return requestedVersion
  }

  return getLatestVersion(aircraftKey) || versions[versions.length - 1]
}

function findModulePath(aircraftKey, version) {
  if (!version) {
    return null
  }

  const targetSuffix = `gen_apm_params_def_${aircraftKey}_${version}.json`
  return (
    Object.keys(paramDefinitionModules).find((path) =>
      path.endsWith(targetSuffix),
    ) || null
  )
}

export function useParamDefinitions() {
  const aircraftType = useSelector(selectAircraftType)
  const flightSwVersion = useSelector(selectFlightSwVersion)
  const [paramDefs, setParamDefs] = useState({})

  const aircraftKey = useMemo(
    () => getAircraftKey(aircraftType),
    [aircraftType],
  )

  const requestedVersion = useMemo(
    () => parseMajorMinor(flightSwVersion),
    [flightSwVersion],
  )

  const resolvedVersion = useMemo(
    () => getResolvedVersion(aircraftKey, requestedVersion),
    [aircraftKey, requestedVersion],
  )

  useEffect(() => {
    const modulePath = findModulePath(aircraftKey, resolvedVersion)

    if (!modulePath) {
      setParamDefs({})
      return
    }

    let cancelled = false

    paramDefinitionModules[modulePath]().then((loadedModule) => {
      if (!cancelled) {
        setParamDefs(loadedModule.default || {})
      }
    })

    return () => {
      cancelled = true
    }
  }, [aircraftKey, resolvedVersion])

  return {
    paramDefs,
    aircraftKey,
    requestedVersion,
    resolvedVersion,
  }
}
