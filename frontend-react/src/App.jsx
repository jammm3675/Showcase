import React, { useState } from 'react';
import './App.css';
import styled from 'styled-components';
import apiClient from './api/axios'; // Use the new apiClient

// Component Imports
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Screen Imports
import MyCollectionsScreen from './screens/MyCollectionsScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import MyShowcasesScreen from './screens/MyShowcasesScreen';
import CreateShowcaseScreen from './screens/CreateShowcaseScreen';
import ShowcaseDetailScreen from './screens/ShowcaseDetailScreen';

const mockUser = {
  id: 12345,
  walletAddress: 'EQAFmjUoZUqKFEBGYFEMbv-m61sFStgAfUR8J6hJDwUU09iT',
};

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

const CollectionsTab = ({ walletAddress }) => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  return selectedCollection ? (
    <CollectionDetailScreen
      collection={selectedCollection}
      onBack={() => setSelectedCollection(null)}
    />
  ) : (
    <MyCollectionsScreen walletAddress={walletAddress} onSelectCollection={setSelectedCollection} />
  );
};

const ShowcasesTab = ({ telegramId }) => {
  const [view, setView] = useState('list');
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async ({ title, description }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/showcases', { telegram_id: telegramId, title, description });
      setView('list');
    } catch (error) {
      console.error("Failed to create showcase:", error);
      alert("Error: Could not create showcase.");
    } finally {
      setIsSubmitting(false);
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

  if (selectedShowcase) {
    return <ShowcaseDetailScreen showcase={selectedShowcase} onBack={() => setSelectedShowcase(null)} onExport={handleExport} />;
  }
  if (view === 'create') {
    return <CreateShowcaseScreen onBack={() => setView('list')} onSubmit={handleCreateSubmit} isSubmitting={isSubmitting} />;
  }
  return <MyShowcasesScreen key={view} telegramId={telegramId} onCreateNew={() => setView('create')} onSelectShowcase={setSelectedShowcase} />;
};


function App() {
  const [activeTab, setActiveTab] = useState('collections');
  const user = mockUser;

  const renderContent = () => {
    if (!user) {
      return <h2>Please connect your wallet.</h2>;
    }
    switch (activeTab) {
      case 'collections':
        return <CollectionsTab walletAddress={user.walletAddress} />;
      case 'showcases':
        return <ShowcasesTab telegramId={user.id} />;
      case 'market':
        return <h2 style={{fontWeight: 600}}>Market (Coming Soon)</h2>;
      case 'profile':
        return <h2 style={{fontWeight: 600}}>Profile (Coming Soon)</h2>;
      default:
        return <CollectionsTab walletAddress={user.walletAddress} />;
    }
  };

  return (
    <AppContainer>
      <Header />
      <MainContent>
        {renderContent()}
      </MainContent>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </AppContainer>
  );
}

export default App;
