<template>
  <nav class="tab-bar">
    <router-link to="/" class="tab-item">Главная</router-link>
    <router-link to="/search" class="tab-item">Поиск</router-link>
    <router-link to="/profile" class="tab-item">Профиль</router-link>
  </nav>
</template>

<script setup>
// We don't need any specific script logic for this simple component,
// as Vue Router handles the navigation and active states via the component and classes.
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--surface-color, #1E1E1E);
  border-top: 1px solid #2a2a2a;
  padding: 0 10px;
  box-sizing: border-box;
}

.tab-item {
  background: none;
  border: none;
  color: var(--secondary-text-color, #9E9E9E);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: var(--border-radius, 12px);
  transition: background-color 0.2s, color 0.2s;
  flex-grow: 1;
  text-align: center;
  text-decoration: none; /* Remove underline from links */
}

.tab-item:hover {
  color: var(--text-color, #E0E0E0);
}

/* Vue Router applies this class to the link of the currently active route */
.tab-item.router-link-exact-active {
  color: var(--text-color, #E0E0E0);
  background-color: #333;
}
</style>
