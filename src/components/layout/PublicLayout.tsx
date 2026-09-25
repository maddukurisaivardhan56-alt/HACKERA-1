import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col m-0 p-0 overflow-x-hidden">
      <main className="flex-1 w-full m-0 p-0">
        <Outlet />
      </main>
    </div>
  );
};
