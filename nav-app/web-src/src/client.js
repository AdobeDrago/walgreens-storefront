/**
 * Hydrates the server-rendered nav: React attaches to the existing markup instead of re-rendering
 * it, using the model the action embedded next to it.
 */
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import Nav from '../../src/Nav.js';
import './nav.css';

const ROOT_ID = 'wnav-root';
const DATA_ID = 'wnav-data';

const root = document.getElementById(ROOT_ID);
const data = document.getElementById(DATA_ID);
if (root && data) {
  hydrateRoot(root, React.createElement(Nav, { model: JSON.parse(data.textContent) }));
}
