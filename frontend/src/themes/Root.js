import React from 'react';
import { Context } from '../context/context';

function Root({ children }) {
  return (
    <Context>
      {children}
    </Context>
  );
}

export default Root;