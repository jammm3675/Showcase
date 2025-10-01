import React from 'react';
import styled from 'styled-components';

const ScreenContainer = styled.div`
  text-align: left;
`;

const ButtonBar = styled.div`
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
`;

const BackButton = styled(ActionButton)`
  background: none;
  padding: 0;
  margin-bottom: 1rem;
`;

const ExportButton = styled(ActionButton)`
  background-color: #34c759; /* Green */
`;

const AddButton = styled(ActionButton)`
  background-color: #007aff; /* Blue */
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


const ShowcaseDetailScreen = ({ showcase, onBack, onExport, onAddNfts }) => {
  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back to Showcases</BackButton>
      <h2 style={{fontWeight: 600, marginTop: 0}}>{showcase.title}</h2>
      <p>{showcase.description}</p>
      <ButtonBar>
        <AddButton onClick={onAddNfts}>Add/Edit NFTs</AddButton>
        <ExportButton onClick={() => onExport(showcase.id)}>Export as Image</ExportButton>
      </ButtonBar>
      <div>
        <h3 style={{fontWeight: 600}}>Included NFTs</h3>
        {showcase.showcase_nfts && showcase.showcase_nfts.length > 0 ? (
           <NftGrid>
            {showcase.showcase_nfts.map(nft => (
                <NftImage key={nft.id} src={nft.image} alt={nft.name} />
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