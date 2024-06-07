/*
  Custom component for dashboard
  Displays messages with different severity
*/

// Base imports
import { useEffect, useRef, useState } from 'react'
import moment from 'moment'

// Third party imports
import { ScrollArea } from '@mantine/core'

export default function StatusMessages(props) {
  const viewport = useRef(null)
  const [scrollPosition, onScrollPositionChange] = useState({ x: 0, y: 0 })

  // Pushes new messages to bottom
  useEffect(() => {
    if (scrollPosition.y < 100) {
      viewport.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [props.messages])

  function getSeverityClassNames(severity) {
    switch (severity) {
      case 0:
        return 'font-bold text-falconred'
      case 1:
        return 'text-red-500'
      case 2:
        return 'text-red-400'
      case 3:
        return 'text-orange-500'
      case 4:
        return 'text-amber-500'
      case 5:
        return 'text-amber-300'
      case 7:
        return 'text-gray-400'
      default:
        return ''
    }
  }

  function getScrollAreaOutsideVisibilityClassNames() {
    let base = 'h-44 w-full p-4'
    return props.outsideVisibility ? base + " bg-black !h-64" : base;
  }

  function getMessageOutsideVisibilityClassNames() {
    let base = 'flex flex-row space-x-2 text-xl'
    return props.outsideVisibility ? base + " font-bold !text-2xl" : base;
  }

  return (
    <div className={props.className}>
      <ScrollArea
        className={getScrollAreaOutsideVisibilityClassNames()}
        viewportRef={viewport}
        onScrollPositionChange={onScrollPositionChange}
      >
        {props.messages.map((message, index) => {
          return (
            <div key={index} className={getMessageOutsideVisibilityClassNames()}>
              <p className='text-gray-400'>
                {moment.unix(message.timestamp).format('HH:mm:ss')}
              </p>
              <p className={getSeverityClassNames(message.severity)}>
                {message.text}
              </p>
            </div>
          )
        })}
      </ScrollArea>
    </div>
  )
}
