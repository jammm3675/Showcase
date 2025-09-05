import React from 'react';
import styled from 'styled-components';
import NftCard from '../components/NftCard';

const ScreenContainer = styled.div`
  text-align: left;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
`;

const CollectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const CollectionImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-right: 1rem;
  object-fit: cover;
  background-color: #1c1c1e;
`;

const CollectionInfo = styled.div`
  flex: 1;
`;

const CollectionTitle = styled.h2`
  margin: 0 0 0.75rem 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 1rem;
`;

const Stat = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  & > span {
    display: block;
    color: #8e8e93;
    font-size: 0.75rem;
    font-weight: 400;
  }
`;

const NftGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const CollectionDetailScreen = ({ collection, onBack }) => {
  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back</BackButton>
      <CollectionHeader>
        <CollectionImage src={collection.nfts[0]?.image} alt={collection.name} />
        <CollectionInfo>
          <CollectionTitle>{collection.name}</CollectionTitle>
          <StatsGrid>
            <Stat>7.7 💎 <span>Floor price</span></Stat>
            <Stat>58 💎 <span>7d volume</span></Stat>
            <Stat>{collection.nfts.length} <span>Items</span></Stat>
            <Stat>0% <span>7d change</span></Stat>
          </StatsGrid>
        </CollectionInfo>
      </CollectionHeader>

      <h3 style={{fontWeight: 600}}>Items</h3>
      <NftGrid>
        {collection.nfts.map((nft) => (
          <NftCard key={nft.address} nft={nft} />
        ))}
      </NftGrid>
    </ScreenContainer>
  );
};

export default CollectionDetailScreen;
