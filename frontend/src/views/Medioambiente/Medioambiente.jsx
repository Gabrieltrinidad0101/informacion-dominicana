import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Medioambiente() {
  return (
    <div>
      <Chats descriptions={topics} topic="worldBank/Medioambiente" />
    </div>
  )
}
