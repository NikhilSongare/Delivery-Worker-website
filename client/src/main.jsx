import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import App from './App.jsx'

// StrictMode double-mount breaks Leaflet; maps render outside StrictMode.
createRoot(document.getElementById('root')).render(
  <>
    <App />
  </>,
)
