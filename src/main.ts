import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './style.css'

const rootElement = document.getElementById('app')
if (!rootElement) {
  throw new Error('App element not found')
}

const root = ReactDOM.createRoot(rootElement)
root.render(React.createElement(App))
