import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
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

const MyCollectionsScreen = ({ walletAddress, onSelectCollection }) => {
  const [collections, setCollections] = useState([]);
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
        const response = await axios.get(`/api/nfts/${walletAddress}`);
        const groupedCollections = groupNftsByCollection(response.data.nfts);
        setCollections(groupedCollections);
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

  if (loading) return <p>Loading your collections...</p>;
  if (error) return <p style={{ color: '#ff453a' }}>{error}</p>;

  return (
    <ScreenContainer>
      {collections.length > 0 ? (
        collections.map((collection) => (
          <div key={collection.name} onClick={() => onSelectCollection(collection)}>
            <CollectionCard collection={collection} />
          </div>
        ))
      ) : (
        <p>No NFT collections found in this wallet.</p>
      )}
    </ScreenContainer>
  );
};

export default MyCollectionsScreen;
