import { createSelector, createSlice } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"

const checklistSlice = createSlice({
  name: "checklist",
  initialState: { items: [] },
  reducers: {
    pushChecklist: (state, action) => {
      if (!doesItemExistByName(state, action.payload.name)) {
        state.items.push({
          id: uuidv4(),
          name: action.payload.name,
          value: action.payload.value,
        }) // Surely there won't be a uuid collision right!
      }
    },
    deleteChecklistById: (state, action) => {
      state.items = state.items.filter(
        (element) => element.id !== action.payload,
      )
    },
    setChecklistItems: (state, action) => {
      if (action.payload === state.items) return
      state.items = action.payload
    },
    setNewChecklistName: (state, action) => {
      if (
        doesItemExistById(state, action.payload.id) &&
        !doesItemExistByName(state, action.payload.newName)
      ) {
        state.items = state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, name: action.payload.newName }
            : item,
        )
      }
    },
    setChecklistValueById: (state, action) => {
      if (doesItemExistById(state, action.payload.id)) {
        state.items = state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, value: action.payload.value }
            : item,
        )
      }
    },
  },
  selectors: {
    selectChecklists: (state) => {
      return state.items
    },
  },
})

function doesItemExistById(state, id) {
  return state.items.find((element) => element.id == id)
}

function doesItemExistByName(state, name) {
  return (
    state.items.find(
      (element) => element.name.toLowerCase() == name.toLowerCase(),
    ) !== undefined
  )
}

export const selectChecklistById = (id) =>
  createSelector([checklistSlice.selectors.selectChecklists], (items) =>
    items.find((element) => element.id == id),
  )

export const {
  pushChecklist,
  deleteChecklistById,
  setChecklistItems,
  setNewChecklistName,
  setChecklistValueById,
} = checklistSlice.actions
export const { selectChecklists } = checklistSlice.selectors

export default checklistSlice
