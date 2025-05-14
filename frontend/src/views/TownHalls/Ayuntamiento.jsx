import React from 'react'
import { Charts } from '../../components/charts/Charts'
export function Ayuntamiento({name}) {
  console.log(name)
  return (
    <div>
      <Charts topic={`townHalls/${name}`} />
    </div>
  )
}
