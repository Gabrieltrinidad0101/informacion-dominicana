import React, {useRef, useEffect, useState } from 'react'
import { ChatBase } from './chatBase'
import "./Chat.css"
const isLoad = {}
export function Chat({description,topic}) {
  const containerChat = useRef()
  const verifyVisibility =(entry)=>{
    if (isLoad[description] || !entry[0].isIntersecting) return
    isLoad[description] = entry[0].isIntersecting
    ChatBase(containerChat.current,description.replaceAll("%","%25").replaceAll("U+00a0"," "),topic)
  }

  useEffect(()=>{
    const observer = new IntersectionObserver(verifyVisibility)
    observer.observe(containerChat.current)
  },[])

  return (
      <div className='custom-chart-card'>
        <div className='custom-chart-card-title'>
          <h3>{description}</h3>
          <a href="#">Fuentes</a>
        </div>
        <div>
          <div  ref={containerChat} ></div>
        </div>
      </div>
  )
}
