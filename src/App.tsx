import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@campnetwork/origin/react'
import Layout from './components/Layout'
import Home from './pages/Home'
import HomeNew from './pages/HomeNew'
import Marketplace from './pages/Marketplace'
import CreateIP from './pages/CreateIP'
import CreateIPOrigin from './pages/CreateIPOrigin'
import MyIPs from './pages/MyIPs'
import IPDetail from './pages/IPDetail'
import Chat from './pages/Chat'
import Auctions from './pages/Auctions'
import Lottery from './pages/Lottery'
import AuthCallback from './pages/AuthCallback'

function App() {
  const { jwt } = useAuth()

  return (
    <div className="min-h-screen bg-mesh-gradient dark:bg-gradient-to-br dark:from-camp-dark dark:via-gray-900 dark:to-black">
      <Routes>
        <Route path="/auth/*" element={<AuthCallback />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeNew />} />
          <Route path="home-original" element={<Home />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="create" element={jwt ? <CreateIP /> : <HomeNew />} />
          <Route path="create-ip" element={<CreateIPOrigin />} />
          <Route path="my-ips" element={jwt ? <MyIPs /> : <HomeNew />} />
          <Route path="ip/:id" element={<IPDetail />} />
          <Route path="chat" element={jwt ? <Chat /> : <HomeNew />} />
          <Route path="auctions" element={<Auctions />} />
          <Route path="lottery" element={<Lottery />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
