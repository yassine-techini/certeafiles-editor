/**
 * CerteaFiles Editor - Demo Application Entry Point
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { DemoApp } from './demo';
import { HomePage, DocumentPage, PlaygroundPage } from './demo/pages';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<DemoApp />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/document/:documentId" element={<DocumentPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
