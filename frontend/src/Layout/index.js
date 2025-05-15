import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import { Context } from '../context/context';
import { CompareCharts } from '../components/compareCharts/CompareCharts';

export default function Layout(props) {
  return (
    <Context>
      <OriginalLayout {...props} />
      <CompareCharts />
    </Context>
  );
}