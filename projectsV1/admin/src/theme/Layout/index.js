import React from 'react';
import Layout from '@theme-original/Layout';
import { ClerkProvider, useClerk, useUser } from '@clerk/clerk-react'
import Login from '../../views/Login/Login';



const PUBLISHABLE_KEY = process.env.REACT_APP_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const AuthLayout = (props) => {
  const { isSignedIn } = useUser();
  if (!isSignedIn) {
    return <Login></Login>
  }
  return  <Layout {...props} />
}

export default function LayoutWrapper(props) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthLayout {...props} />
    </ClerkProvider>
  );
}