// Central registry for checklist state bindings.
// Keep a single source of truth here and derive any UI-friendly arrays from it.

export const CHECKLIST_AUTO_BINDINGS = Object.freeze({
  DroneConnected: Object.freeze({
    key: "drone.connected",
    label: "Drone Connected",
  }),
})

export const CHECKLIST_AUTO_BINDING_OPTIONS = Object.freeze(
  Object.values(CHECKLIST_AUTO_BINDINGS),
)
