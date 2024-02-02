import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Educacion() {
  return (
    <div>
      <Chats descriptions={topics} topic="Educacion" />
    </div>
  )
}
