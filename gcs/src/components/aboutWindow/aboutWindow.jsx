"use client"

import packageJson from "../../../package.json"

export default function AboutWindow() {
  return (
    <div className="w-full h-full bg-falcongrey-800">
      <div
        className={
          "flex flex-col items-center justify-between w-full h-full gap text-center p-4"
        }
      >
        <img src="titlebar_logo.svg" className="max-h-5" />
        <div className="flex flex-col">
          <a
            href={packageJson.homepage}
            target="_blank"
            className="hover:text-falconred-400"
          >
            Our website
          </a>
          <a
            href={packageJson.githubLink}
            target="_blank"
            className="hover:text-falconred-400"
          >
            Our GitHub
          </a>
          <a
            href={packageJson.bugs.url}
            target="_blank"
            className="hover:text-falconred-400"
          >
            Report a bug
          </a>
        </div>
        <p>{packageJson.version} | Made with ❤ in the UK</p>
      </div>
    </div>
  )
}
