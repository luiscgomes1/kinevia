import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import './index.css'
import { router } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') return
  console.error('[unhandledRejection]', event.reason)
})

window.addEventListener('error', (event) => {
  console.error('[unhandledError]', event.error || event.message)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        duration: 10000,
      }}
    />
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)
