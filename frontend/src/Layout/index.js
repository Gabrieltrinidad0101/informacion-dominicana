import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import { Context } from '../context/context';

export default function Layout(props) {
  return (
    <Context>
      <OriginalLayout {...props} />
    </Context>
  );
}