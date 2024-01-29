import React, {useRef, useEffect } from 'react'
import { ChatBase } from './chatBase'
import "./Chat.css"
export default function Chat() {
  const containerChat = useRef()
  useEffect(()=>{
    if(containerChat.current === null) return
    ChatBase(containerChat.current)
  },[])
  return (
    <div className='custom-chart-card'>
      <div>
        <h1>Title</h1>
      </div>
      <div>
        <div  ref={containerChat} ></div>
      </div>
    </div>
  )
}
