import React from 'react';

const sources = [
  {
    name: 'World Bank',
    url: 'https://data.worldbank.org/country/DO',
  },
  {
    name: 'Ayuntamiento de Moca',
    url: 'https://ayuntamientomoca.gob.do/',
  },
  {
    name: 'Ayuntamiento de Jarabacoa',
    url: 'https://ayuntamientojarabacoa.gob.do/',
  },
  {
    name: 'Ayuntamiento de Cotuí',
    url: 'https://ayuntamientocotui.gob.do/',
  },
];

export function Fuentes() {
  return (
    <div>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
