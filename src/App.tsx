import React from 'react';
import { AppProvider } from './context/AppContext';
import { CMSProvider } from './context/CMSContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <CMSProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </CMSProvider>
  );
}

export default App;
