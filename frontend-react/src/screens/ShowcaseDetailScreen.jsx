import React from 'react';
import styled from 'styled-components';

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
`;

const ExportButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #34c759; /* Green color for export */
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin: 1rem 0;
`;

const NftGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const NftImage = styled.img`
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
`;


const ShowcaseDetailScreen = ({ showcase, onBack, onExport }) => {
  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back to Showcases</BackButton>
      <h2 style={{fontWeight: 600, marginTop: 0}}>{showcase.Title}</h2>
      <p>{showcase.Description}</p>
      <ExportButton onClick={() => onExport(showcase.ID)}>Export as Image</ExportButton>
      <div>
        <h3 style={{fontWeight: 600}}>Included NFTs</h3>
        {showcase.ShowcaseNfts && showcase.ShowcaseNfts.length > 0 ? (
           <NftGrid>
            {showcase.ShowcaseNfts.map(nft => (
                <NftImage key={nft.ID} src={nft.Image} alt={nft.Name} />
            ))}
           </NftGrid>
        ) : (
          <p>(No NFTs have been added to this showcase yet.)</p>
        )}
      </div>
    </ScreenContainer>
  );
};

export default ShowcaseDetailScreen;
