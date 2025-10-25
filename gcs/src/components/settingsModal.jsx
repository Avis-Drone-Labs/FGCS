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
import { useDisclosure } from "@mantine/hooks"
import DefaultSettings from "../../data/default_settings.json"

const isValidNumber = (num, range) => {
  return (
    num &&
    parseInt(num) &&
    (range === null || (range[0] <= num && num <= range[1]))
  )
}

function TextSetting({ settingName, hidden, matches }) {
  const { getSetting, setSetting } = useSettings()
  const [error, setError] = useState(null)

  const [newValue, setNewValue] = useState(getSetting(settingName));

  const handleChange = (e) => {
    const newValue = e.currentTarget.value
    setNewValue(newValue)

    if (matches) {
      const regex = new RegExp(matches)
      if (!regex.test(newValue)) {
        setError("Invalid input format")
      } else {
        setError(null)
        setSetting(settingName, newValue)
      }
    }
  }

  return (
    <div>
      <Input
        value={newValue}
        onChange={handleChange}
        type={hidden ? "password" : "text"}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
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

function ExtendableNumberSetting({ settingName, range, suffix }) {
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
            defaultValue={value}
            min={range ? range[0] : null}
            max={range ? range[1] : null}
            onChange={(num) => {
              if (!isValidNumber(num, range)) return
              updateValue(id, parseInt(num))
            }}
            suffix={suffix}
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

function Setting({ settingName, df, initialValue }) {
  const { getSetting } = useSettings()
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (initialValue !== undefined)
      setChanged(
        JSON.stringify(getSetting(settingName)) != JSON.stringify(initialValue),
      )
  }, [getSetting(settingName)])

  return (
    <div
      className={`flex flex-row gap-8 justify-between ${df.type != "extendableNumber" && "items-center"} px-10 `}
    >
      <div className="space-y-px relative">
        <div className="">{df.display}:</div>
        <p className="text-gray-400 text-sm">{df.description}</p>
        {df.requireRestart && (
          <p
            className={`${changed ? "text-falconred" : "text-gray-600"} text-xs`}
          >
            (requires restart)
          </p>
        )}
      </div>
      {df.type == "extendableNumber" ? (
        <ExtendableNumberSetting
          settingName={settingName}
          range={df.range || null}
          suffix={df.suffix}
        />
      ) : df.type == "number" ? (
        <NumberSetting settingName={settingName} range={df.range || null} />
      ) : df.type == "boolean" ? (
        <BoolSetting settingName={settingName} options={df.options} />
      ) : df.type == "option" ? (
        <OptionSetting settingName={settingName} options={df.options} />
      ) : (
        <TextSetting settingName={settingName} hidden={df.hidden || false} matches={df.matches} />
      )}
    </div>
  )
}

function SettingsModal() {
  const settingTabs = Object.keys(DefaultSettings)

  const { getSetting, opened, close } = useSettings()
  const [initialSettings, setInitialSettings] = useState({})

  const [
    confirmRestartOpened,
    { open: confirmRestartOpen, close: confirmRestartClose },
  ] = useDisclosure(false)

  const [changedRestartSettings, setChangedRestartSettings] = useState([])

  function closeCheckRestart() {
    const changedRestartSettings = []
    Object.entries(DefaultSettings).forEach(([section, sectionSettings]) => {
      Object.entries(sectionSettings).forEach(([key, def]) => {
        const fullKey = `${section}.${key}`
        const changed =
          JSON.stringify(getSetting(fullKey)) !==
          JSON.stringify(initialSettings[fullKey])

        if (changed && def.requireRestart) {
          changedRestartSettings.push(fullKey)
        }
      })
    })

    setChangedRestartSettings(changedRestartSettings)

    if (changedRestartSettings.length > 0) {
      confirmRestartOpen()
    } else {
      close()
    }
  }

  useEffect(() => {
    if (opened) {
      const snapshot = {}

      Object.entries(DefaultSettings).forEach(([section, sectionSettings]) => {
        Object.entries(sectionSettings).forEach(([key]) => {
          const fullKey = `${section}.${key}`
          snapshot[fullKey] = getSetting(fullKey)
        })
      })

      setInitialSettings(snapshot)
    }
  }, [opened])

  return (
    <>
      <Modal
        centered
        onClose={closeCheckRestart}
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
          <Tabs.List className="shrink-0">
            {settingTabs.map((t) => {
              return (
                <Tabs.Tab key={t} value={t}>
                  {t}
                </Tabs.Tab>
              )
            })}
          </Tabs.List>
          {settingTabs.map((tab) => {
            const tabSettings = DefaultSettings[tab]
            const groupedSettings = {}

            Object.entries(tabSettings).forEach(([key, def]) => {
              const group = def.group || "Ungrouped"
              if (!groupedSettings[group]) {
                groupedSettings[group] = []
              }
              groupedSettings[group].push({ key, def })
            })

            return (
              <Tabs.Panel className="space-y-6" value={tab} key={tab}>
                {Object.keys(groupedSettings).map((group) => (
                  <div className="pb-2" key={group}>
                    {group !== "Ungrouped" && (
                      <h2 className="text-lg font-semibold text-white px-10 pb-2">
                        {group}
                      </h2>
                    )}
                    <div className="space-y-4">
                      {groupedSettings[group].map(({ key, def }) => (
                        <Setting
                          key={`${tab}.${key}`}
                          settingName={`${tab}.${key}`}
                          df={def}
                          initialValue={initialSettings[`${tab}.${key}`]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(tabSettings).length === 0 && (
                  <p className="pl-4 pt-2">No settings available right now.</p>
                )}
              </Tabs.Panel>
            )
          })}
        </Tabs>
      </Modal>
      <Modal
        opened={confirmRestartOpened}
        onClose={confirmRestartClose}
        title="Restart Required"
        centered
        withCloseButton={false}
      >
        <p className="mb-2">
          The following changes require a restart to take effect. Restart now?
        </p>
        <div className="mb-4">
          {changedRestartSettings.map((setting) => (
            <p key={setting}>
              {
                setting
                  .split(".")
                  .reduce((title, value) => title[value], DefaultSettings)[
                "display"
                ]
              }
            </p>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            onClick={() => {
              close()
              confirmRestartClose()
            }}
          >
            Restart Later
          </Button>
          <Button
            color="red"
            onClick={() => {
              window.ipcRenderer.send("app:restart")
            }}
          >
            Restart Now
          </Button>
        </div>
      </Modal>
    </>
  )
}

// If settings don't change then the modal does not need to re-render
export default memo(SettingsModal)
