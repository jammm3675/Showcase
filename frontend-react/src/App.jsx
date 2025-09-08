import React, { useState, useEffect } from 'react';
import './App.css';
import styled from 'styled-components';
import apiClient from './api/axios';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

// ... (imports)

const ShowcasesTab = ({ telegramId, walletAddress }) => {
  const [view, setView] = useState('list');
  const [selectedShowcase, setSelectedShowcase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force re-fetch

  const handleCreateSubmit = async ({ title, description }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/showcases', { telegram_id: telegramId, title, description });
      setView('list');
      setRefreshKey(k => k + 1); // Trigger refresh
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
      setRefreshKey(k => k + 1); // Trigger refresh
    } catch (error) {
      console.error("Error adding NFTs to showcase:", error);
      alert("Failed to save NFTs.");
    }
  };

  const handleExport = async (showcaseId) => {
      // ... (export logic)
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

  // Pass the key to MyShowcasesScreen
  return <MyShowcasesScreen key={refreshKey} telegramId={telegramId} onCreateNew={() => setView('create')} onSelectShowcase={(showcase) => { setSelectedShowcase(showcase); setView('detail'); }} />;
};

// ... (rest of App.jsx)
// I will replace the full file content with this logic
// This is just a summary of the change.
