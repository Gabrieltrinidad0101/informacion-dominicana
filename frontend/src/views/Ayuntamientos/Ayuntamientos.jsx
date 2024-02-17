import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Ayuntamientos() {
  return (
    <div>
      <Chats descriptions={topics} topic="townHalls/ayuntamientoJarabacoa/datas" />
    </div>
  )
}
