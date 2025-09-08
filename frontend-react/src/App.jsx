import React, { useState, useEffect } from 'react';
import './App.css';
import styled from 'styled-components';
import apiClient from './api/axios';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

// Component Imports
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Screen Imports
import MyCollectionsScreen from './screens/MyCollectionsScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import MyShowcasesScreen from './screens/MyShowcasesScreen';
import CreateShowcaseScreen from './screens/CreateShowcaseScreen';
import ShowcaseDetailScreen from './screens/ShowcaseDetailScreen';
import AddNftsToShowcaseScreen from './screens/AddNftsToShowcaseScreen';
import SearchScreen from './screens/SearchScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';

const AppContainer = styled.div`
  background-color: #1a1a1a;
  min-height: 100vh;
  color: white;
`;

const MainContent = styled.main`
  padding: 1rem;
  padding-top: 80px;
  padding-bottom: 80px;
`;

const ConnectWalletContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 50vh;
`;

const ProfileTab = ({ walletAddress }) => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  return selectedCollection ? <CollectionDetailScreen collection={selectedCollection} onBack={() => setSelectedCollection(null)} /> : <MyCollectionsScreen walletAddress={walletAddress} onSelectCollection={setSelectedCollection} />;
};

const ShowcasesTab = ({ telegramId, walletAddress }) => {
  const [view, setView] = useState('list');
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSubmit = async ({ title, description }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/showcases', { telegram_id: telegramId, title, description });
      setView('list');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error("Failed to create showcase:", error);
      alert("Error: Could not create showcase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNfts = async (nfts) => {
    if (!selectedShowcase) return;
    try {
      const response = await apiClient.post(`/showcases/${selectedShowcase.id}/nfts`, { nfts });
      setSelectedShowcase(response.data);
      setView('detail');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error("Error adding NFTs to showcase:", error);
      alert("Failed to save NFTs.");
    }
  };

  const handleExport = async (showcaseId) => {
    try {
      const response = await apiClient.post(`/showcases/${showcaseId}/export`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `showcase-${showcaseId}-collage.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting collage:', error);
      alert('Failed to export collage.');
    }
  };

  if (view === 'detail') {
    return <ShowcaseDetailScreen showcase={selectedShowcase} onBack={() => setView('list')} onExport={handleExport} onAddNfts={() => setView('addNfts')} />;
  }
  if (view === 'create') {
    return <CreateShowcaseScreen onBack={() => setView('list')} onSubmit={handleCreateSubmit} isSubmitting={isSubmitting} />;
  }
  if (view === 'addNfts') {
    return <AddNftsToShowcaseScreen showcase={selectedShowcase} walletAddress={walletAddress} onBack={() => setView('detail')} onSave={handleSaveNfts} />;
  }

  return <MyShowcasesScreen key={refreshKey} telegramId={telegramId} onCreateNew={() => setView('create')} onSelectShowcase={(showcase) => { setSelectedShowcase(showcase); setView('detail'); }} />;
};

const SearchTab = () => {
    const [viewedUser, setViewedUser] = useState(null);
    if (viewedUser) {
        return <PublicProfileScreen user={viewedUser} onBack={() => setViewedUser(null)} />;
    }
    return <SearchScreen onSelectUser={setViewedUser} />;
};

function App() {
  const [activeTab, setActiveTab] = useState('showcases');
  const wallet = useTonWallet();
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const tgInitData = window.Telegram?.WebApp?.initData;

  useEffect(() => {
    if (wallet && tgUser && tgInitData) {
      apiClient.post('/connect_wallet', { telegram_id: tgUser.id, wallet_address: wallet.account.address, username: tgUser.username, first_name: tgUser.first_name, init_data: tgInitData, }).catch(err => console.error(err));
    }
  }, [wallet, tgUser, tgInitData]);

  const renderContent = () => {
    if (!wallet || !tgUser) {
      return <ConnectWalletContainer><h2 style={{fontWeight:600}}>Welcome to Showcase</h2><p>Please connect your wallet to continue.</p><TonConnectButton /></ConnectWalletContainer>;
    }
    switch (activeTab) {
      case 'showcases':
        return <ShowcasesTab telegramId={tgUser.id} walletAddress={wallet.account.address} />;
      case 'search':
        return <SearchTab />;
      case 'profile':
        return <ProfileTab walletAddress={wallet.account.address} />;
      default:
        return <ShowcasesTab telegramId={tgUser.id} walletAddress={wallet.account.address} />;
    }
  };

  return (
    <AppContainer>
      <Header />
      <MainContent>
        {renderContent()}
      </MainContent>
      {wallet && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </AppContainer>
  );
}

export default App;
