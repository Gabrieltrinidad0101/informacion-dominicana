import React, { useEffect, useState } from 'react'
import { Chart } from '../chart/Chart'
import chartCss from './charts.module.css'
import constants from '../../constants'

export function Charts({topic,headers,deparment, customTheme,compare}) {
  const [titles,setTitles] = useState([])
  useEffect(()=>{
    if(headers) return setTitles(headers)
    fetch(`${constants.urlData}/${topic}/headers.json`).then(async res=>{
      const data = await res.json()
      setTitles(data)
    })
  },[])
  return (
    <div className={chartCss.containerCustom}>
      {
        titles.map((chart,index)=><Chart compare={compare} topic={topic} deparment={deparment} description={chart} key={index} customTheme={customTheme}/>)
      }
    </div>
  )
}
