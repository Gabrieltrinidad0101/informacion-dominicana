import React from 'react'
import { Chat } from '../chat/Chat'
import ChatCss from './chats.module.css'
export function Chats({descriptions,topic}) {
  return (
    <div className={ChatCss.containerCustom}>
      {
        descriptions.map((chat,index)=><Chat topic={topic} description={chat} key={index}/>)
      }
    </div>
  )
}
