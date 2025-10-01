import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axios';
import CollectionCard from '../components/CollectionCard';

const ScreenContainer = styled.div`
  /* The main padding will be handled by the App's MainContent component */
`;

const groupNftsByCollection = (nfts) => {
  if (!nfts) return [];
  const grouped = nfts.reduce((acc, nft) => {
    const key = nft.collection_name || 'Uncategorized';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        nfts: [],
      };
    }
    acc[key].nfts.push(nft);
    return acc;
  }, {});
  return Object.values(grouped);
};

const MyNftsScreen = ({ walletAddress, onSelectGroup }) => {
  const [nftGroups, setNftGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      setError("Wallet address is not available.");
      return;
    }

    const fetchNfts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/nfts/${walletAddress}`);
        const groupedNfts = groupNftsByCollection(response.data.nfts);
        setNftGroups(groupedNfts);
        setError(null);
      } catch (err) {
        setError('Failed to fetch NFTs. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNfts();
  }, [walletAddress]);

  if (loading) return <p>Loading your NFTs...</p>;
  if (error) return <p style={{ color: '#ff453a' }}>{error}</p>;

  return (
    <ScreenContainer>
      <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem'}}>My NFTs</h2>
      {nftGroups.length > 0 ? (
        nftGroups.map((group) => (
          <div key={group.name} onClick={() => onSelectGroup(group)}>
            <CollectionCard collection={group} />
          </div>
        ))
      ) : (
        <p>No NFTs found in this wallet.</p>
      )}
    </ScreenContainer>
  );
};

export default MyNftsScreen;