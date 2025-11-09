import React from 'react';
import Layout from '@theme-original/Layout';
import { ClerkProvider,useClerk } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = process.env.REACT_APP_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default function LayoutWrapper(props) {
  return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <Layout {...props} />
      </ClerkProvider>
  );
}