import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axios';

const ScreenContainer = styled.div`
  text-align: left;
`;

const NftSelectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
`;

const NftItem = styled.div`
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? '#007aff' : '#444'};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const NftImage = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
`;

const Checkbox = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background-color: ${props => props.isSelected ? '#007aff' : 'rgba(0,0,0,0.5)'};
  border: 1px solid white;
  border-radius: 50%;
`;

const FixedFooter = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #2c2c2e;
  padding: 1rem;
  max-width: 480px;
  margin: 0 auto;
  border-top: 1px solid #444;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #007aff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
`;

const AddNftsToShowcaseScreen = ({ showcase, walletAddress, onBack, onSave }) => {
  const [allNfts, setAllNfts] = useState([]);
  const [selectedNfts, setSelectedNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all NFTs for the user
    apiClient.get(`/nfts/${walletAddress}`)
      .then(response => {
        setAllNfts(response.data.nfts);
        // Pre-select NFTs that are already in the showcase
        const existingNftAddresses = showcase.showcase_nfts.map(nft => nft.nft_address);
        setSelectedNfts(response.data.nfts.filter(nft => existingNftAddresses.includes(nft.address)));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [walletAddress, showcase]);

  const handleSelectNft = (nft) => {
    setSelectedNfts(prev => {
      if (prev.find(item => item.address === nft.address)) {
        return prev.filter(item => item.address !== nft.address);
      } else {
        return [...prev, nft];
      }
    });
  };

  if (loading) return <p>Loading your NFTs...</p>;

  return (
    <ScreenContainer>
      <button onClick={onBack}>&lt; Back to Showcase</button>
      <h2>Add NFTs to "{showcase.Title}"</h2>
      <NftSelectionGrid>
        {allNfts.map(nft => {
          const isSelected = selectedNfts.find(item => item.address === nft.address);
          return (
            <NftItem key={nft.address} isSelected={isSelected} onClick={() => handleSelectNft(nft)}>
              <NftImage src={nft.image} alt={nft.name} />
              <Checkbox isSelected={isSelected} />
            </NftItem>
          )
        })}
      </NftSelectionGrid>
      <FixedFooter>
        <SaveButton onClick={() => onSave(selectedNfts)}>
          Save {selectedNfts.length} NFTs
        </SaveButton>
      </FixedFooter>
    </ScreenContainer>
  );
};

export default AddNftsToShowcaseScreen;
