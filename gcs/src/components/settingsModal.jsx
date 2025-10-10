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

import { IconAlertCircle, IconCheck, IconTrash } from "@tabler/icons-react"
import { memo, useEffect, useState } from "react"
import DefaultSettings from "../../data/default_settings.json"
import {
  closeLoadingNotification,
  redColor,
  showLoadingNotification,
} from "../helpers/notification"

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

function ExtendableTextSetting({ settingName, df }) {
  const { getSetting, setSetting } = useSettings()

  const [items, setItems] = useState(
    getSetting(settingName).length > 0
      ? getSetting(settingName).map((item) => {
          const newItem = { id: generateId() }
          df.fields.forEach((field) => {
            newItem[field.key] = item[field.key] || ""
          })
          return newItem
        })
      : [],
  )

  useEffect(() => {
    const cleanItems = items.map((item) => {
      const cleanItem = {}
      df.fields.forEach((field) => {
        cleanItem[field.key] = item[field.key]
      })
      return cleanItem
    })
    setSetting(settingName, cleanItems)
  }, [items, settingName, setSetting, df.fields])

  const updateItemField = (id, fieldKey, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [fieldKey]: value } : item,
      ),
    )
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const validateField = (field, value) => {
    if (!field.validation || !value) return { isValid: true, error: null }

    switch (field.validation) {
      case "rtsp":
        try {
          const parsedUrl = new URL(value)
          const isValid = parsedUrl.protocol === "rtsp:"
          return {
            isValid,
            error: isValid ? null : "Invalid RTSP URL",
          }
        } catch {
          return { isValid: false, error: "Invalid RTSP URL" }
        }
      default:
        return { isValid: true, error: null }
    }
  }

  const addNewItem = () => {
    const newItem = { id: generateId() }
    df.fields.forEach((field) => {
      newItem[field.key] = ""
    })
    setItems([...items, newItem])
  }

  return (
    <div className="flex flex-col shrink-0 items-end gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-2 items-start">
          <button
            className="text-falconred-600 hover:text-falconred-700 p-1 rounded-full mt-1"
            onClick={() => removeItem(item.id)}
            title={`Remove ${df.display.toLowerCase().slice(0, -1)}`}
          >
            <IconTrash size={20} />
          </button>
          <div className="flex flex-col gap-1 min-w-80">
            {df.fields.map((field) => {
              const validation = validateField(field, item[field.key])
              return (
                <Input
                  key={field.key}
                  placeholder={field.placeholder}
                  value={item[field.key]}
                  onChange={(e) =>
                    updateItemField(item.id, field.key, e.currentTarget.value)
                  }
                  size="sm"
                  error={validation.error}
                  rightSection={
                    item[field.key] && field.validation ? (
                      validation.isValid ? (
                        <IconCheck size={16} className="text-green-500" />
                      ) : (
                        <IconAlertCircle size={16} className="text-red-500" />
                      )
                    ) : null
                  }
                />
              )
            })}
          </div>
        </div>
      ))}
      <div className="w-full pl-9">
        <Button fullWidth onClick={addNewItem} size="sm">
          Add {df.display.slice(0, -1)}
        </Button>
      </div>
    </div>
  )
}

function FFmpegBinarySetting({ settingName }) {
  const { getSetting, setSetting } = useSettings()
  const [binaryInfo, setBinaryInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load binary info on component mount
  useEffect(() => {
    loadBinaryInfo()
  }, [])

  const loadBinaryInfo = async () => {
    try {
      const info = await window.ipcRenderer.invoke("ffmpeg:get-binary-info")
      setBinaryInfo(info)

      // Update the setting with the current path
      if (info.exists && info.path !== getSetting(settingName)) {
        setSetting(settingName, info.path)
      }
    } catch (error) {
      console.error("Failed to load FFmpeg binary info:", error)
    }
  }

  const handleDownload = async () => {
    const loadingNotificationId = showLoadingNotification(
      "Info",
      "Downloading FFmpeg binary...",
    )
    setIsLoading(true)

    try {
      const result = await window.ipcRenderer.invoke("ffmpeg:download-binary")

      if (result.success) {
        closeLoadingNotification(
          loadingNotificationId,
          "Success",
          "FFmpeg binary downloaded successfully!",
        )
        setSetting(settingName, result.path)
        await loadBinaryInfo()
      } else {
        closeLoadingNotification(
          loadingNotificationId,
          "Error",
          `Download failed: ${result.error}`,
          { color: redColor },
        )
      }
    } catch (error) {
      closeLoadingNotification(
        loadingNotificationId,
        "Error",
        `Download failed: ${error.message}`,
        { color: redColor },
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    const loadingNotificationId = showLoadingNotification(
      "Info",
      "Removing FFmpeg binary...",
    )
    setIsLoading(true)

    try {
      const result = await window.ipcRenderer.invoke("ffmpeg:delete-binary")

      if (result.success) {
        closeLoadingNotification(
          loadingNotificationId,
          "Success",
          "Binary removed successfully!",
        )
        setSetting(settingName, "")
        await loadBinaryInfo()
      } else {
        closeLoadingNotification(
          loadingNotificationId,
          "Error",
          "Failed to remove binary",
          { color: redColor },
        )
      }
    } catch (error) {
      closeLoadingNotification(
        loadingNotificationId,
        "Error",
        `Failed to remove binary: ${error.message}`,
        { color: redColor },
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="px-10">
      {binaryInfo?.exists ? (
        <div className="bg-green-900/20 border border-green-700 rounded p-3">
          <div className="flex flex-row items-center gap-2 mb-2">
            <IconCheck size={16} className="text-green-400" />
            <p>FFmpeg binary is installed</p>
            <br />
          </div>
          <p className="text-xs text-slate-400 mb-2">Path: {binaryInfo.path}</p>
          <p className="text-xs text-slate-400 mb-2">
            Size: {formatFileSize(binaryInfo.size)}
          </p>
          <Button
            size="compact-xs"
            color="red"
            onClick={handleDelete}
            loading={isLoading}
          >
            Remove Binary
          </Button>
        </div>
      ) : (
        <div className="bg-orange-900/20 border border-orange-700 rounded p-3">
          <div className="mb-2 flex items-center gap-2">
            <IconAlertCircle size={16} className="text-orange-400" />
            <p>FFmpeg binary not found</p>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Download FFmpeg to enable RTSP stream conversion
          </p>
          <Button
            size="xs"
            color="blue"
            onClick={handleDownload}
            loading={isLoading}
          >
            Download FFmpeg
          </Button>
        </div>
      )}
    </div>
  )
}

function Setting({ settingName, df }) {
  // Special handling for FFmpeg binary settings
  if (settingName === "Video.ffmpegBinaryPath") {
    return <FFmpegBinarySetting settingName={settingName} />
  }

  // Skip the download status setting as it's managed internally
  if (settingName === "Video.ffmpegDownloadStatus") {
    return null
  }

  return (
    <div
      className={`flex flex-row gap-8 justify-between ${df.type != "extendableNumber" && df.type != "extendableText" && "items-center"} px-10 `}
    >
      <div className="space-y-px">
        <div>{df.display}:</div>
        <p className="text-gray-400 text-sm">{df.description}</p>
      </div>
      {df.type == "extendableNumber" ? (
        <ExtendableNumberSetting
          settingName={settingName}
          range={df.range || null}
          suffix={df.suffix}
        />
      ) : df.type == "extendableText" ? (
        <ExtendableTextSetting settingName={settingName} df={df} />
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
              {Object.keys(DefaultSettings[t])
                .map((s) => {
                  const setting = (
                    <Setting
                      settingName={`${t}.${s}`}
                      df={DefaultSettings[t][s]}
                      key={`${t}.${s}`}
                    />
                  )
                  return setting
                })
                .filter(Boolean)}
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
