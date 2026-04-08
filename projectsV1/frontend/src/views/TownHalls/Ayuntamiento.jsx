import React from 'react'
import { Charts } from '../../components/charts/Charts'
export function Ayuntamiento({name}) {
  return (
    <div>
      <Charts topic={`townHalls/${name}`} />
    </div>
  )
}
