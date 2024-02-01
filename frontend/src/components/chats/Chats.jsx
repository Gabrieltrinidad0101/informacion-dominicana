import React, { useEffect, useState } from 'react'
import { Chat } from '../chat/Chat'
import ChatCss from './chats.module.css'
export function Chats() {
  const [descriptions,setDescriptions] = useState(["1","2","3","4","5","6","7","8","9","1","2","3","4","5","6","7","8","9"])
  useEffect(()=>{
    // void async function (){
    //   const res = await fetch("http://127.0.0.1:5500/processedData/data.json")
    //   const data = await res.json()
    //   setDescriptions(data)
    // }()
  },[])


  return (
    <div className={ChatCss.containerCustom}>
      {
        descriptions.map((chat,index)=><Chat description={chat} key={index}/>)
      }
    </div>
  )
}
