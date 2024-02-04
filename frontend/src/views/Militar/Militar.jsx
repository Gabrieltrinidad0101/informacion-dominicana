import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Militar() {
  return (
    <div>
      <Chats descriptions={topics} topic="bancoMundial/Militar" />
    </div>
  )
}
