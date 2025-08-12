import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CampProvider, useViem } from '@campnetwork/origin/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.tsx'
import { createConfig, http, WagmiProvider, type Config } from 'wagmi'
import { supportedChains } from './lib/chains.ts'

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



const wagmiConfig:Config = createConfig({
  chains: supportedChains,
  // Add any additional wagmi configuration options here
 
  transports: {
    [supportedChains[0].id]: http("https://rpc.basecamp.t.raas.gelato.cloud"), // Use http() for each chain, or customize for Camp Network
    // Add more if you support multiple chains
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider
          config={wagmiConfig}
        >

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
          </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
