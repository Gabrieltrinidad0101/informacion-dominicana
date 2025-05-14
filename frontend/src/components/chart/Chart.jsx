import React, {useRef, useEffect, useState } from 'react'
import { chartBase } from './chartBase'
import "./chart.css"
let isLoad = {}
export function Chart({description,topic,customTheme}) {
  const containerChart = useRef()
  const verifyVisibility =(entry)=>{
    if (isLoad[description] || !entry[0].isIntersecting) return
    isLoad[description] = entry[0].isIntersecting
    chartBase(containerChart.current,description,topic,customTheme)
  }

  useEffect(()=>{
    isLoad = {}
    const observer = new IntersectionObserver(verifyVisibility)
    observer.observe(containerChart.current)
  },[])

  return (
      <div className='custom-chart-card'>
        <div className='custom-chart-card-title'>
          <h3>{description}</h3>
          <div>
            <a href="#">Fuentes</a>
            <a href="#">Comparar</a>
          </div>
        </div>
        <div>
          <div  ref={containerChart} ></div>
        </div>
      </div>
  )
}
