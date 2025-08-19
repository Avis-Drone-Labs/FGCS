/*
  This component is run only once at the start of the application load. It should
  only be called from main.jsx and that's it.
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd part libraries
import { Button, Modal } from "@mantine/core"
import {
  useDisclosure,
  useLocalStorage,
} from "@mantine/hooks"
import { useSessionStorage } from "@uidotdev/usehooks"
import { Octokit } from "octokit"
import semverGt from "semver/functions/gt"

// Custom helpers
import { showErrorNotification } from "../helpers/notification.js"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
import { useSettings } from "../helpers/settings.js"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const octokit = new Octokit({})

export default function SingleRunWrapper({ children }) {
  const [opened, { open, close }] = useDisclosure(false)
  const [fgcsOutOfDateInfo, setFgcsOutOfDateInfo] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [outOfDate, setOutOfDate] = useSessionStorage("outOfDate", false)

  const [isUpdateDismissed, setUpdateDismissed] = useLocalStorage({
    key: "isUpdateDismissed",
  })

  const { getSetting } = useSettings()

  useEffect(() => {
    async function checkIfOutOfDate() {
      // Check if the current application is out of date if it's running in production,
      // this is done by getting the latest release from the GitHub API and comparing
      // it to the current version.

      const nodeEnv = await window.ipcRenderer.getNodeEnv()
      if (nodeEnv !== "production") return

      const currentVersion = await window.ipcRenderer.getVersion()

      // https://docs.github.com/en/rest/releases/releases#get-the-latest-release
      const latestGithubRelease = await octokit.request(
        "GET /repos/{owner}/{repo}/releases/latest",
        {
          owner: "Avis-Drone-Labs",
          repo: "fgcs",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      )

      if (latestGithubRelease.status === 200) {
        const latestVersion = latestGithubRelease.data.tag_name
        if (semverGt(latestVersion, currentVersion)) {
          setFgcsOutOfDateInfo({
            currentVersion,
            latestVersion,
          })
          setOutOfDate(true)
        }
      } else {
        showErrorNotification(
          "Failed to check for updates. Please check your internet connection.",
        )
      }
    }
    if (getSetting("General.autoCheckForUpdates")) checkIfOutOfDate()
  }, [])

  // Checks there is an update that the user has not already dismissed
  useEffect(() => {
    if (
      fgcsOutOfDateInfo !== null &&
      isUpdateDismissed !== `${fgcsOutOfDateInfo?.latestVersion}`
    ) {
      open()
    }
  }, [fgcsOutOfDateInfo, isUpdateDismissed])

  const closeForever = () => {
    close()
    setUpdateDismissed(fgcsOutOfDateInfo?.latestVersion)
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Your version of FGCS is out of date."
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <p>
          The latest release is{" "}
          <span className="font-bold text-green-400">
            {fgcsOutOfDateInfo?.latestVersion}
          </span>{" "}
          but you currently have{" "}
          <span className="font-bold text-red-400">
            v{fgcsOutOfDateInfo?.currentVersion}
          </span>
          . Please update FGCS to get the latest features, improvements and bug
          fixes.
        </p>
        <div className="flex gap-x-2 mt-5">
          <Button
            component="a"
            onClick={closeForever}
            fullWidth
            color={tailwindColors.red[600]}
          >
            Skip update
          </Button>
          <Button
            component="a"
            href="https://github.com/Avis-Drone-Labs/FGCS/releases"
            target="_blank"
            fullWidth
            color={tailwindColors.blue[600]}
          >
            Update
          </Button>
        </div>
      </Modal>
      {children}
    </>
  )
}
