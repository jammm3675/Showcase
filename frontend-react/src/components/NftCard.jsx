import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background-color: #2c2c2e;
  border-radius: 12px;
  overflow: hidden;
  text-align: left;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    transition: transform 0.2s ease-in-out;
  }
`;

const NftImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  background-color: #1c1c1e;
`;

const CardContent = styled.div`
  padding: 0.75rem;
`;

const Name = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
`;

const NftCard = ({ nft }) => {
  // In a real app, price would come from props
  const price = Math.floor(Math.random() * 100) + 10;

  return (
    <Card>
      <NftImage src={nft.image} alt={nft.name} />
      <CardContent>
        <Name>{nft.name}</Name>
        <PriceContainer>
          <span>💎</span>
          <span style={{ marginLeft: '4px' }}>{price}</span>
        </PriceContainer>
      </CardContent>
    </Card>
  );
};

export default NftCard;
