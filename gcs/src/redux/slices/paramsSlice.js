import { createSlice } from "@reduxjs/toolkit"

const paramsSlice = createSlice({
  name: "paramsSlice",
  initialState: {
    rebootData: {},
    autoPilotRebootModalOpen: false,
    params: [],
    shownParams: [],
    modifiedParams: [],
    showModifiedParams: false,
    fetchingVars: false,
    fetchingVarsProgress: 0,
    searchValue: "",
    hasFetchedOnce: false,
  },
  reducers: {
    setRebootData: (state, action) => {
      if (action.payload === state.rebootData) return
      state.rebootData = action.payload
    },
    setAutoPilotRebootModalOpen: (state, action) => {
      if (action.payload === state.autoPilotRebootModalOpen) return
      state.autoPilotRebootModalOpen = action.payload
    },
    setParams: (state, action) => {
      if (action.payload === state.params) return
      state.params = action.payload
    },
    setShownParams: (state, action) => {
      if (action.payload === state.shownParams) return
      state.shownParams = action.payload
    },
    setModifiedParams: (state, action) => {
      if (action.payload === state.modifiedParams) return
      state.modifiedParams = action.payload
    },
    setFetchingVars: (state, action) => {
      if (action.payload === state.fetchingVars) return
      state.fetchingVars = action.payload
    },
    setFetchingVarsProgress: (state, action) => {
      if (action.payload === state.fetchingVarsProgress) return
      state.fetchingVarsProgress = action.payload
    },
    setParamSearchValue: (state, action) => {
      if (action.payload === state.searchValue) return
      state.searchValue = action.payload
    },
    toggleShowModifiedParams: (state) => {
      state.showModifiedParams = !state.showModifiedParams
    },
    appendModifiedParams: (state, action) => {
      state.modifiedParams = state.modifiedParams.concat(action.payload)

      // Delete where initial_value and param_value are the same, this is the case when someone deletes the input and puts it in again
      // as the same - very niche case but can happen
      state.modifiedParams = state.modifiedParams.filter(
        (item) => item.initial_value !== item.param_value,
      )
    },
    updateParamValue: (state, action) => {
      state.params = state.params.map((item) =>
        item.param_id === action.payload.param_id
          ? { ...item, param_value: action.payload.param_value }
          : item,
      )
    },
    updateModifiedParamValue: (state, action) => {
      // Update param_value
      state.modifiedParams = state.modifiedParams.map((item) =>
        item.param_id === action.payload.param_id
          ? { ...item, param_value: action.payload.param_value }
          : item,
      )

      // Delete where initial_value and param_value are the same
      state.modifiedParams = state.modifiedParams.filter(
        (item) => item.initial_value !== item.param_value,
      )
    },
    deleteModifiedParam: (state, action) => {
      state.modifiedParams = state.modifiedParams.filter(
        (item) => item.param_id !== action.payload.param_id,
      )
    },
    resetParamState: (state) => {
      state.fetchingVars = false
      state.fetchingVarsProgress = 0
      state.params = []
      state.shownParams = []
      state.modifiedParams = []
      state.rebootData = {}
      state.searchValue = ""
    },
    setHasFetchedOnce: (state, action) => {
      state.hasFetchedOnce = action.payload
    },

    // Emitters (empty objects to be captured in the middleware)
    emitRebootAutopilot: () => {},
    emitRefreshParams: () => {},
    emitSetMultipleParams: () => {},
  },
  selectors: {
    selectRebootData: (state) => state.rebootData,
    selectAutoPilotRebootModalOpen: (state) => state.autoPilotRebootModalOpen,
    selectParams: (state) => state.params,
    selectSingleParam(state, param_id) {
      return state.params.find((param) => param.param_id === param_id)
    },
    selectShownParams: (state) => state.shownParams,
    selectModifiedParams: (state) => state.modifiedParams,
    selectShowModifiedParams: (state) => state.showModifiedParams,
    selectFetchingVars: (state) => state.fetchingVars,
    selectFetchingVarsProgress: (state) => state.fetchingVarsProgress,
    selectParamSearchValue: (state) => state.searchValue,
    selectHasFetchedOnce: (state) => state.hasFetchedOnce,
  },
})

export const {
  setRebootData,
  setAutoPilotRebootModalOpen,
  setParams,
  setShownParams,
  setModifiedParams,
  setFetchingVars,
  setFetchingVarsProgress,
  setParamSearchValue,
  toggleShowModifiedParams,
  appendModifiedParams,
  updateParamValue,
  updateModifiedParamValue,
  deleteModifiedParam,
  resetParamState,
  emitRebootAutopilot,
  emitRefreshParams,
  emitSetMultipleParams,
  setHasFetchedOnce,
} = paramsSlice.actions
export const {
  selectRebootData,
  selectAutoPilotRebootModalOpen,
  selectParams,
  selectSingleParam,
  selectShownParams,
  selectModifiedParams,
  selectFetchingVars,
  selectFetchingVarsProgress,
  selectShowModifiedParams,
  selectParamSearchValue,
  selectHasFetchedOnce,
} = paramsSlice.selectors

export default paramsSlice
