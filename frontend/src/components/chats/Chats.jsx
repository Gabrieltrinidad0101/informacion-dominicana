import React, { useEffect, useState } from 'react'
import { Chat } from '../chat/Chat'
import ChatCss from './chats.module.css'
import constants from '../../constants'
export function Chats({topic,headers,customTheme}) {
  const [titles,setTitles] = useState([])
  useEffect(()=>{
    if(headers) return setTitles(headers)
    fetch(`${constants.urlData}/${topic}/headers.json`).then(async res=>{
      const data = await res.json()
      setTitles(data)
    })
  },[])
  return (
    <div className={ChatCss.containerCustom}>
      {
        titles.map((chat,index)=><Chat topic={topic} description={chat} key={index} customTheme={customTheme}/>)
      }
    </div>
  )
}
