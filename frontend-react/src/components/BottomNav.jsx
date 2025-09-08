import React from 'react';
import styled from 'styled-components';

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.75rem 0;
  background-color: #2c2c2e;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px; /* Match #root max-width */
  margin: 0 auto;
  border-top: 1px solid #444;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8e8e93;
  text-decoration: none;
  font-size: 0.75rem;
  cursor: pointer;

  &.active {
    color: white;
  }

  &:hover {
    color: #c7c7cc;
  }
`;

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <NavContainer>
      <NavItem
        className={activeTab === 'showcases' ? 'active' : ''}
        onClick={() => onTabChange('showcases')}
      >
        Showcases
      </NavItem>
      <NavItem
        className={activeTab === 'search' ? 'active' : ''}
        onClick={() => onTabChange('search')}
      >
        Search
      </NavItem>
      <NavItem
        className={activeTab === 'profile' ? 'active' : ''}
        onClick={() => onTabChange('profile')}
      >
        Profile
      </NavItem>
    </NavContainer>
  );
};

export default BottomNav;
