import React, { useState } from 'react';
import styled from 'styled-components';
import MyCollectionsScreen from './MyCollectionsScreen';
import CollectionDetailScreen from './CollectionDetailScreen';

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

const ProfileHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const PublicProfileScreen = ({ user, onBack }) => {
  const [selectedCollection, setSelectedCollection] = useState(null);

  if (selectedCollection) {
    return (
      <CollectionDetailScreen
        collection={selectedCollection}
        onBack={() => setSelectedCollection(null)}
      />
    );
  }

  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back to Search</BackButton>
      <ProfileHeader>
        <h2 style={{fontWeight: 600, marginTop: 0}}>{user.first_name || 'User'}'s Profile</h2>
        <p>@{user.username || 'No username'}</p>
      </ProfileHeader>
      <MyCollectionsScreen
        walletAddress={user.wallet_address}
        onSelectCollection={setSelectedCollection}
      />
    </ScreenContainer>
  );
};

export default PublicProfileScreen;
