import React from 'react'
import {topics} from "./topics"
import { Chats } from '../../components/chats/Chats'
export function Ayuntamiento({name}) {
  console.log(name)
  return (
    <div>
      <Chats descriptions={topics} topic={`townHalls/${name}`} />
    </div>
  )
}
