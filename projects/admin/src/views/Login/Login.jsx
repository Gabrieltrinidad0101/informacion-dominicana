import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { ClerkProvider } from '@clerk/clerk-react';
const PUBLISHABLE_KEY = process.env.REACT_APP_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default function Login() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <SignIn />
        </div>
    </ClerkProvider>
  );
}
