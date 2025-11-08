import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.REACT_APP_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default function Layout(props) {
  return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <OriginalLayout {...props} />
      </ClerkProvider>
  );
}