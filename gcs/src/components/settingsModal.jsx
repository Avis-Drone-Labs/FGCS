import {
  Button,
  Checkbox,
  Input,
  Modal,
  NativeSelect,
  NumberInput,
  Tabs,
} from "@mantine/core"
import { useSettings } from "../helpers/settings"

import { IconTrash } from "@tabler/icons-react"
import { memo, useEffect, useState } from "react"
import DefaultSettings from "../../data/default_settings.json"

const isValidNumber = (num, range) => {
  return (
    num &&
    parseInt(num) &&
    (range === null || (range[0] <= num && num <= range[1]))
  )
}

function TextSetting({ settingName, hidden }) {
  const { getSetting, setSetting } = useSettings()
  return (
    <Input
      value={getSetting(settingName)}
      onChange={(e) => setSetting(settingName, e.currentTarget.value)}
      type={hidden ? "password" : "text"}
    />
  )
}

function BoolSetting({ settingName }) {
  const { getSetting, setSetting } = useSettings()
  return (
    <Checkbox
      checked={getSetting(settingName)}
      onChange={(e) => setSetting(settingName, e.currentTarget.checked)}
    />
  )
}

function OptionSetting({ settingName, options }) {
  const { getSetting, setSetting } = useSettings()
  return (
    <NativeSelect
      data={options}
      value={getSetting(settingName)}
      onChange={(e) => setSetting(settingName, e.currentTarget.value)}
    />
  )
}

function NumberSetting({ settingName, range }) {
  const { getSetting, setSetting } = useSettings()

  return (
    <Input
      value={getSetting(settingName)}
      onChange={(e) => {
        const num = e.currentTarget.value
        if (isValidNumber(num, range)) setSetting(settingName, num)
      }}
    />
  )
}

const generateId = () => Math.random().toString(36).slice(8)

function ExtendableNumberSetting({ settingName, range }) {
  const { getSetting, setSetting } = useSettings()

  const [values, setValues] = useState(
    getSetting(settingName).map((val) => ({ id: generateId(), value: val })),
  )

  useEffect(() => {
    setSetting(
      settingName,
      values.map((a) => a.value),
    )
  }, [values])

  const updateValue = (id, value) => {
    setValues((prev) => prev.map((a) => (a.id === id ? { ...a, value } : a)))
  }

  const removeValue = (id) => {
    setValues((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col shrink-0 items-end gap-2">
      {values.map(({ id, value }) => (
        <div key={id} className="flex gap-2 items-center">
          <button
            className="text-falconred-600 hover:text-falconred-700 p-1 rounded-full"
            onClick={() => removeValue(id)}
          >
            <IconTrash size={20} />
          </button>
          <NumberInput
            value={value}
            onChange={(num) => {
              if (!isValidNumber(num, range)) return
              updateValue(id, parseInt(num))
            }}
            suffix="m"
          />
        </div>
      ))}
      <div className="w-full pl-9">
        <Button
          fullWidth
          onClick={() => setValues([...values, { id: generateId(), value: 0 }])}
        >
          Add new Alert
        </Button>
      </div>
    </div>
  )
}

function Setting({ settingName, df }) {
  return (
    <div
      className={`flex flex-row gap-8 justify-between ${df.type != "extendableNumber" && "items-center"} px-10 `}
    >
      <div className="space-y-px">
        <div>{df.display}:</div>
        <p className="text-gray-400 text-sm">{df.description}</p>
      </div>
      {df.type == "extendableNumber" ? (
        <ExtendableNumberSetting
          settingName={settingName}
          range={df.range || null}
        />
      ) : df.type == "number" ? (
        <NumberSetting settingName={settingName} range={df.range || null} />
      ) : df.type == "boolean" ? (
        <BoolSetting settingName={settingName} options={df.options} />
      ) : df.type == "option" ? (
        <OptionSetting settingName={settingName} options={df.options} />
      ) : (
        <TextSetting settingName={settingName} hidden={df.hidden || false} />
      )}
    </div>
  )
}

function SettingsModal() {
  const settingTabs = Object.keys(DefaultSettings)

  const { opened, close } = useSettings()

  return (
    <Modal
      centered
      onClose={close}
      title="User Settings"
      opened={opened}
      size={"50%"}
      styles={{
        content: { backgroundColor: "rgb(23 26 27)" },
        header: { backgroundColor: "rgb(23 26 27)" },
      }}
      bg="bg-falcongrey-900"
      radius="15px"
      shadow="xs"
    >
      <Tabs
        defaultValue="General"
        orientation="vertical"
        className="bg-falcongrey-900"
        color="#BA1B0B"
        h="50vh"
        styles={{ list: { width: "15%" } }}
      >
        <Tabs.List>
          {settingTabs.map((t) => {
            return (
              <Tabs.Tab key={t} value={t}>
                {t}
              </Tabs.Tab>
            )
          })}
        </Tabs.List>
        {settingTabs.map((t) => {
          return (
            <Tabs.Panel className="space-y-4" value={t} key={t}>
              {Object.keys(DefaultSettings[t]).map((s) => {
                return (
                  <Setting
                    settingName={`${t}.${s}`}
                    df={DefaultSettings[t][s]}
                    key={`${t}.${s}`}
                  />
                )
              })}
              {Object.keys(DefaultSettings[t]).length == 0 && (
                <p className="pl-4 pt-2">No settings available right now.</p>
              )}
            </Tabs.Panel>
          )
        })}
      </Tabs>
    </Modal>
  )
}

// If settings don't change then the modal does not need to re-render
export default memo(SettingsModal)
