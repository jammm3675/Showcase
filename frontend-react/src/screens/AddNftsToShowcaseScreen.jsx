import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axios';

const ScreenContainer = styled.div`
  text-align: left;
  padding-bottom: 100px; /* Add padding to avoid overlap with footer */
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

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  padding: 0;
`;


const AddNftsToShowcaseScreen = ({ showcase, walletAddress, onBack, onSave }) => {
  const [allNfts, setAllNfts] = useState([]);
  const [selectedNfts, setSelectedNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndPrepareNfts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/nfts/${walletAddress}`);
            const userNfts = response.data.nfts || [];
            setAllNfts(userNfts);

            const existingNftAddresses = new Set((showcase.showcase_nfts || []).map(nft => nft.nft_address));
            setSelectedNfts(userNfts.filter(nft => existingNftAddresses.has(nft.address)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchAndPrepareNfts();
  }, [walletAddress, showcase]);

  const handleSelectNft = (nft) => {
    setSelectedNfts(prev => {
      const isSelected = prev.some(item => item.address === nft.address);
      if (isSelected) {
        return prev.filter(item => item.address !== nft.address);
      } else {
        return [...prev, nft];
      }
    });
  };

  if (loading) return <p>Loading your NFTs...</p>;

  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back to Showcase</BackButton>
      <h2 style={{fontWeight: 600}}>Add/Remove NFTs</h2>
      <p>Select the NFTs you want to include in "{showcase.title}".</p>
      <NftSelectionGrid>
        {allNfts.map(nft => {
          const isSelected = selectedNfts.some(item => item.address === nft.address);
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
          Save Changes
        </SaveButton>
      </FixedFooter>
    </ScreenContainer>
  );
};

export default AddNftsToShowcaseScreen;