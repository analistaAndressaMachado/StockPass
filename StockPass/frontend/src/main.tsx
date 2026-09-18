import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './components/Sidebar/Sidebar.css';
import './pages/Painel/Painel.css';
import './components/Header/Header.css';
import './components/Modal/Modal.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);