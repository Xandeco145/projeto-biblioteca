import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import App from './App.jsx';
import { LibraryProvider } from './context/LibraryContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LibraryProvider>
      <App />
    </LibraryProvider>
  </React.StrictMode>
);