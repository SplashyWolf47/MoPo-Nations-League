import React from 'react';
import PublicView from './PublicView';
import AdminPanel from './AdminPanel';

const App = () => {
  // Simple routing based on URL path
  const path = window.location.pathname;

  if (path === '/admin') {
    return <AdminPanel />;
  }

  // Default to public view for all other paths
  return <PublicView />;
};

export default App;
