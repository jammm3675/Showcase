import React, { useState } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axios';

const ScreenContainer = styled.div`
  text-align: left;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #444;
  background-color: #2c2c2e;
  color: white;
  margin-bottom: 1rem;
`;

const UserResultItem = styled.div`
  background-color: #2c2c2e;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #3a3a3c;
  }
`;

const SearchScreen = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) {
        setResults([]);
        return;
    };
    setLoading(true);
    try {
      const response = await apiClient.get(`/search/users?query=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <h2 style={{fontWeight: 600}}>Search Users</h2>
      <form onSubmit={handleSearch}>
        <SearchInput
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      {loading && <p>Searching...</p>}
      <div>
        {results.map(user => (
          <UserResultItem key={user.telegram_id} onClick={() => onSelectUser(user)}>
            <h4>{user.first_name || 'User'} (@{user.username})</h4>
            <p>{user.nft_count} NFTs</p>
          </UserResultItem>
        ))}
      </div>
    </ScreenContainer>
  );
};

export default SearchScreen;
