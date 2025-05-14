// CompareModalContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const CompareModalContext = createContext();

// Create a provider component
export const Context = ({ children }) => {
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const openCompareModal = () => setIsCompareModalOpen(true);
  const closeCompareModal = () => setIsCompareModalOpen(false);

  return (
    <CompareModalContext.Provider value={{ isCompareModalOpen, openCompareModal, closeCompareModal }}>
      {children}
    </CompareModalContext.Provider>
  );
};

// Custom hook to use the CompareModalContext
export const useCompareModal = () => {
  return useContext(CompareModalContext);
};