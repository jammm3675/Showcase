import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background-color: #2c2c2e;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: #3a3a3c;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ItemCount = styled.span`
  color: #8e8e93;
  font-weight: 500;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  border-radius: 12px;
  overflow: hidden;
  height: 200px; /* Give a fixed height to the grid */
`;

const NftImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #1c1c1e;
`;

const CollectionCard = ({ collection }) => {
  // Take the first 4 NFTs for the preview grid, or fewer if not available
  const previewNfts = collection.nfts.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <Title>{collection.name}</Title>
        <ItemCount>{collection.nfts.length}</ItemCount>
      </CardHeader>
      <ImageGrid>
        {previewNfts.map((nft, index) => (
          <NftImage key={index} src={nft.image} alt={nft.name} />
        ))}
        {/* Fill empty grid cells if less than 4 NFTs */}
        {Array(4 - previewNfts.length).fill(0).map((_, index) => <div key={`fill-${index}`} style={{backgroundColor: '#1c1c1e'}} />)}
      </ImageGrid>
    </Card>
  );
};

export default CollectionCard;
