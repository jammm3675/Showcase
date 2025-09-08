import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #1a1a1a;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  margin: 0;
  font-weight: 600;
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #2c2c2e;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;

  span {
    margin-left: 0.5rem;
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Title>Showcase</Title>
      <BalanceContainer>
        <span>💎</span>
        <span>0 +</span>
      </BalanceContainer>
    </HeaderContainer>
  );
};

export default Header;
