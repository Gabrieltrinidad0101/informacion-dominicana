import React, {useRef, useEffect, useState } from 'react'
import { ChatBase } from './chatBase'
import "./Chat.css"
export function Chat({description}) {
  const containerChat = useRef()
  const verifyVisibility = (element)=>{
    if(!element[0].isIntersecting) return
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
