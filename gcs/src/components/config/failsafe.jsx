import { useEffect } from "react"

import { LoadingOverlay, NumberInput, Select, Switch } from "@mantine/core"

import { useDispatch, useSelector } from "react-redux"

import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

import {
  emitGetFailsafeConfig,
  emitSetFailsafeConfigParam,
  selectFailsafeConfig,
  selectRefreshingFailsafeConfigData,
} from "../../redux/slices/configSlice"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"
import { selectAircraftTypeString } from "../../redux/slices/droneInfoSlice"

export default function Failsafes() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const failsafeConfig = useSelector(selectFailsafeConfig)
  const aircraftTypeString = useSelector(selectAircraftTypeString)
  const refreshingFailsafeConfigData = useSelector(
    selectRefreshingFailsafeConfigData,
  )

  const paramDefs =
    aircraftTypeString === "Copter" ? apmParamDefsCopter : apmParamDefsPlane

  useEffect(() => {
    if (!connected) {
      return
    }

    dispatch(emitSetState("config.failsafe"))
    dispatch(emitGetFailsafeConfig())
  }, [connected, dispatch])

  return (
    <>
      <LoadingOverlay
        visible={refreshingFailsafeConfigData}
        zIndex={1000}
        overlayProps={{ blur: 2 }}
      />
      <div className="mx-auto max-w-screen-lg p-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-wide pb-2">
            Battery Failsafe
          </h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
              <h2 className="font-semibold">Low Battery (Stage 1)</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Voltage Threshold"
                  description="Set to 0 to disable."
                  suffix="V"
                  min={0}
                  value={failsafeConfig.BATT_LOW_VOLT}
                  onChange={(value) => {
                    dispatch(
                      emitSetFailsafeConfigParam({
                        param_id: "BATT_LOW_VOLT",
                        value: Number(value),
                      }),
                    )
                  }}
                  disabled={failsafeConfig.BATT_LOW_VOLT == undefined}
                />
                <NumberInput
                  label="Capacity Threshold"
                  description="Set to 0 to disable."
                  suffix="mAh"
                  min={0}
                  value={failsafeConfig.BATT_LOW_MAH}
                  onChange={(value) => {
                    dispatch(
                      emitSetFailsafeConfigParam({
                        param_id: "BATT_LOW_MAH",
                        value: Number(value),
                      }),
                    )
                  }}
                  disabled={failsafeConfig.BATT_LOW_MAH == undefined}
                />
              </div>
              <Select
                label="Failsafe Low Action"
                allowDeselect={false}
                value={String(failsafeConfig.BATT_FS_LOW_ACT)}
                data={Object.keys(paramDefs.BATT_FS_LOW_ACT.Values).map(
                  (key) => ({
                    value: `${key}`,
                    label: `${key}: ${paramDefs.BATT_FS_LOW_ACT.Values[key]}`,
                  }),
                )}
                onChange={(value) => {
                  dispatch(
                    emitSetFailsafeConfigParam({
                      param_id: "BATT_FS_LOW_ACT",
                      value: Number(value),
                    }),
                  )
                }}
                disabled={failsafeConfig.BATT_FS_LOW_ACT == undefined}
              />
            </div>

            <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
              <h2 className="font-semibold">Critical Battery (Stage 2)</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Voltage Threshold"
                  description="Set to 0 to disable."
                  suffix="V"
                  min={0}
                  value={failsafeConfig.BATT_CRT_VOLT}
                  onChange={(value) => {
                    dispatch(
                      emitSetFailsafeConfigParam({
                        param_id: "BATT_CRT_VOLT",
                        value: Number(value),
                      }),
                    )
                  }}
                  disabled={failsafeConfig.BATT_CRT_VOLT == undefined}
                />
                <NumberInput
                  label="Capacity Threshold"
                  description="Set to 0 to disable."
                  suffix="mAh"
                  min={0}
                  value={failsafeConfig.BATT_CRT_MAH}
                  onChange={(value) => {
                    dispatch(
                      emitSetFailsafeConfigParam({
                        param_id: "BATT_CRT_MAH",
                        value: Number(value),
                      }),
                    )
                  }}
                  disabled={failsafeConfig.BATT_CRT_MAH == undefined}
                />
              </div>
              <Select
                label="Failsafe Critical Action"
                allowDeselect={false}
                value={String(failsafeConfig.BATT_FS_CRT_ACT)}
                data={Object.keys(paramDefs.BATT_FS_CRT_ACT.Values).map(
                  (key) => ({
                    value: `${key}`,
                    label: `${key}: ${paramDefs.BATT_FS_CRT_ACT.Values[key]}`,
                  }),
                )}
                onChange={(value) => {
                  dispatch(
                    emitSetFailsafeConfigParam({
                      param_id: "BATT_FS_CRT_ACT",
                      value: Number(value),
                    }),
                  )
                }}
                disabled={failsafeConfig.BATT_FS_CRT_ACT == undefined}
              />
            </div>
          </div>
        </div>

        {aircraftTypeString === "Copter" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h1 className="text-lg font-bold tracking-wide pb-2">
                  Radio Failsafe
                </h1>
                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <NumberInput
                    label="RC Timeout"
                    suffix="s"
                    min={0}
                    value={failsafeConfig.RC_FS_TIMEOUT}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "RC_FS_TIMEOUT",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.RC_FS_TIMEOUT == undefined}
                  />
                  <Select
                    label="Throttle Failsafe Enable"
                    allowDeselect={false}
                    value={String(failsafeConfig.FS_THR_ENABLE)}
                    data={Object.keys(paramDefs.FS_THR_ENABLE.Values).map(
                      (key) => ({
                        value: `${key}`,
                        label: `${key}: ${paramDefs.FS_THR_ENABLE.Values[key]}`,
                      }),
                    )}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_THR_ENABLE",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_THR_ENABLE == undefined}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-lg font-bold tracking-wide pb-2">
                  GCS Failsafe
                </h1>
                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <NumberInput
                    label="GCS Timeout"
                    suffix="s"
                    min={0}
                    value={failsafeConfig.FS_GCS_TIMEOUT}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_GCS_TIMEOUT",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_GCS_TIMEOUT == undefined}
                  />
                  <Select
                    label="GCS Failsafe Enable"
                    allowDeselect={false}
                    value={String(failsafeConfig.FS_GCS_ENABLE)}
                    data={Object.keys(paramDefs.FS_GCS_ENABLE.Values).map(
                      (key) => ({
                        value: `${key}`,
                        label: `${key}: ${paramDefs.FS_GCS_ENABLE.Values[key]}`,
                      }),
                    )}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_GCS_ENABLE",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_GCS_ENABLE == undefined}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h1 className="text-lg font-bold tracking-wide pb-2">
                  EKF Failsafe
                </h1>
                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <NumberInput
                    label="EKF Threshold"
                    suffix="s"
                    min={0}
                    value={failsafeConfig.FS_EKF_THRESH}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_EKF_THRESH",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_EKF_THRESH == undefined}
                  />
                  <Select
                    label="EKF Failsafe Action"
                    allowDeselect={false}
                    value={String(failsafeConfig.FS_EKF_ACTION)}
                    data={Object.keys(paramDefs.FS_EKF_ACTION.Values).map(
                      (key) => ({
                        value: `${key}`,
                        label: `${key}: ${paramDefs.FS_EKF_ACTION.Values[key]}`,
                      }),
                    )}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_EKF_ACTION",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_EKF_ACTION == undefined}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {aircraftTypeString === "Plane" && (
          <>
            <div className="space-y-2">
              <h1 className="text-lg font-bold tracking-wide pb-2">
                RC Failsafe
              </h1>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <h2 className="font-semibold">Short Failsafe</h2>
                  <NumberInput
                    label="Short Timeout"
                    suffix="s"
                    min={0}
                    value={failsafeConfig.FS_SHORT_TIMEOUT}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_SHORT_TIMEOUT",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_SHORT_TIMEOUT == undefined}
                  />
                  <Select
                    label="Short Action"
                    allowDeselect={false}
                    value={String(failsafeConfig.FS_SHORT_ACTN)}
                    data={Object.keys(paramDefs.FS_SHORT_ACTN.Values).map(
                      (key) => ({
                        value: `${key}`,
                        label: `${key}: ${paramDefs.FS_SHORT_ACTN.Values[key]}`,
                      }),
                    )}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_SHORT_ACTN",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_SHORT_ACTN == undefined}
                  />
                </div>
                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <h2 className="font-semibold">Long Failsafe</h2>
                  <NumberInput
                    label="Long Timeout"
                    suffix="s"
                    min={0}
                    value={failsafeConfig.FS_LONG_TIMEOUT}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_LONG_TIMEOUT",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_LONG_TIMEOUT == undefined}
                  />
                  <Select
                    label="Long Action"
                    allowDeselect={false}
                    value={String(failsafeConfig.FS_LONG_ACTN)}
                    data={Object.keys(paramDefs.FS_LONG_ACTN.Values).map(
                      (key) => ({
                        value: `${key}`,
                        label: `${key}: ${paramDefs.FS_LONG_ACTN.Values[key]}`,
                      }),
                    )}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "FS_LONG_ACTN",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={failsafeConfig.FS_LONG_ACTN == undefined}
                  />
                </div>

                <div className="p-4 rounded-xl bg-falcongrey-900 border border-falcongrey-600 space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="font-semibold">Throttle Failsafe</h1>
                    <Switch
                      checked={failsafeConfig.THR_FAILSAFE}
                      onChange={(event) => {
                        dispatch(
                          emitSetFailsafeConfigParam({
                            param_id: "THR_FAILSAFE",
                            value: Number(event.currentTarget.checked),
                          }),
                        )
                      }}
                      disabled={failsafeConfig.THR_FAILSAFE == undefined}
                    />
                  </div>
                  <NumberInput
                    label="Throttle Threshold"
                    value={failsafeConfig.THR_FS_VALUE}
                    suffix="µs"
                    min={925}
                    max={2200}
                    onChange={(value) => {
                      dispatch(
                        emitSetFailsafeConfigParam({
                          param_id: "THR_FS_VALUE",
                          value: Number(value),
                        }),
                      )
                    }}
                    disabled={!failsafeConfig.THR_FAILSAFE}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-wide pb-2">
                  GCS Failsafe
                </h1>
                <Switch
                  className="mr-4"
                  checked={failsafeConfig.FS_GCS_ENABL}
                  onChange={(event) => {
                    dispatch(
                      emitSetFailsafeConfigParam({
                        param_id: "FS_GCS_ENABL",
                        value: Number(event.currentTarget.checked),
                      }),
                    )
                  }}
                  disabled={failsafeConfig.FS_GCS_ENABL == undefined}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
