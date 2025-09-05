import React, { useState } from 'react';
import styled from 'styled-components';

const ScreenContainer = styled.div`
  text-align: left;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #444;
  background-color: #2c2c2e;
  color: white;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #444;
  background-color: #2c2c2e;
  color: white;
  font-size: 1rem;
  min-height: 100px;
  font-family: inherit;
`;

const SubmitButton = styled.button`
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #007aff;
  border: none;
  border-radius: 12px;
  cursor: pointer;

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
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

const CreateShowcaseScreen = ({ onBack, onSubmit, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      // In a real app, we'd show a more elegant error message
      alert('Title is required.');
      return;
    }
    onSubmit({ title, description });
  };

  return (
    <ScreenContainer>
      <BackButton onClick={onBack}>&lt; Back to Showcases</BackButton>
      <h2 style={{fontWeight: 600, marginTop: 0}}>Create New Showcase</h2>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Showcase Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <TextArea
          placeholder="Showcase Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Showcase'}
        </SubmitButton>
      </Form>
    </ScreenContainer>
  );
};

export default CreateShowcaseScreen;
