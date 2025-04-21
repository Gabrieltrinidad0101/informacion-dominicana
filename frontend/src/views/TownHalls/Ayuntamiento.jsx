import React from 'react'
import { Chats } from '../../components/chats/Chats'
export function Ayuntamiento({name}) {
  console.log(name)
  return (
    <div>
      <Chats topic={`townHalls/${name}`} />
    </div>
  )
}
