import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CampProvider } from '@campnetwork/origin/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

const apollo = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_URL,
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <CampProvider 
          clientId={import.meta.env.VITE_ORIGIN_CLIENT_ID}
          redirectUri={`${window.location.origin}/auth`}
        >
          <ApolloProvider client={apollo}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ApolloProvider>
        </CampProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
