import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axios'; // Use the new apiClient

const ScreenContainer = styled.div`
  text-align: left;
`;

const ShowcaseItem = styled.div`
  background-color: #2c2c2e;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #3a3a3c;
  }
`;

const CreateButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #007aff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 1rem;
`;

const MyShowcasesScreen = ({ telegramId, onCreateNew, onSelectShowcase }) => {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!telegramId) {
        setLoading(false);
        setError("User ID is not available.");
        return;
    }
    const fetchShowcases = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/users/${telegramId}/showcases`);
        setShowcases(response.data || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch showcases.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcases();
  }, [telegramId]);

  if (loading) return <p>Loading showcases...</p>;
  if (error) return <p style={{ color: '#ff453a' }}>{error}</p>;

  return (
    <ScreenContainer>
      <h2 style={{fontWeight: 600}}>My Showcases</h2>
      <CreateButton onClick={onCreateNew}>+ Create New Showcase</CreateButton>
      <div>
        {showcases.length > 0 ? (
          showcases.map(showcase => (
            <ShowcaseItem key={showcase.id} onClick={() => onSelectShowcase(showcase)}>
              <h3>{showcase.title}</h3>
              <p>{showcase.description}</p>
            </ShowcaseItem>
          ))
        ) : (
          <p>You haven't created any showcases yet.</p>
        )}
      </div>
    </ScreenContainer>
  );
};

export default MyShowcasesScreen;
