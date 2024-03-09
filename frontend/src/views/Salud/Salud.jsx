import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Salud() {
  return (
    <div>
      <Chats descriptions={topics} topic="worldBank/Salud" />
    </div>
  )
}
