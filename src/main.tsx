import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ConfigError from './components/ConfigError'
import { missingFirebaseKeys } from './lib/firebaseEnv'

const root = createRoot(document.getElementById('root')!)

if (missingFirebaseKeys.length > 0) {
  root.render(<ConfigError missing={missingFirebaseKeys} />)
} else {
  // App tabhi load hoti hai jab keys maujood hon, warna firebase.ts import par hi crash karta hai
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}