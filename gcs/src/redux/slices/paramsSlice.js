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
      console.log("Appending Param", action.payload.param_value, state.modifiedParams)
    },
    updateParamValue: (state, action) => {
      console.log("Updating the ACTUAL param to be", action.payload.param_value)
      state.params = state.params.map((item) =>
        item.param_id === action.payload.param_id
          ? { ...item, param_value: action.payload.param_value }
          : item,
      )
      console.log("The result of the ACTUAL param is", state.params.find((item) => item.param_id === action.payload.param_id))
    },
    updateModifiedParamValue: (state, action) => {
      console.log("Modifying param")
      state.modifiedParams = state.modifiedParams.map((item) => 
        item.param_id === action.payload.param_id
          ? { ...item, param_value: action.payload.param_value }
          : item,
      )
    },
    resetParamState: (state) => {
      state.fetchingVars = false
      state.fetchingVarsProgress = 0
      state.params = []
      state.shownParams = []
      state.modifiedParams = []
      state.rebootData = []
      state.searchValue = ""
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
    selectShownParams: (state) => state.shownParams,
    selectModifiedParams: (state) => state.modifiedParams,
    selectShowModifiedParams: (state) => state.showModifiedParams,
    selectFetchingVars: (state) => state.fetchingVars,
    selectFetchingVarsProgress: (state) => state.fetchingVarsProgress,
    selectParamSearchValue: (state) => state.searchValue,
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
  resetParamState,
  emitRebootAutopilot,
  emitRefreshParams,
  emitSetMultipleParams,
} = paramsSlice.actions
export const {
  selectRebootData,
  selectAutoPilotRebootModalOpen,
  selectParams,
  selectShownParams,
  selectModifiedParams,
  selectFetchingVars,
  selectFetchingVarsProgress,
  selectShowModifiedParams,
  selectParamSearchValue,
} = paramsSlice.selectors

export default paramsSlice
