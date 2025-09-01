<template>
  <div class="view-container">
    <h2>Поиск пользователей</h2>
    <form @submit.prevent="performSearch" class="search-form">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Введите имя пользователя..."
        class="search-input"
      />
      <button type="submit" class="search-button" :disabled="isLoading">
        {{ isLoading ? 'Поиск...' : 'Найти' }}
      </button>
    </form>

    <div class="results-container">
      <div v-if="isLoading" class="loading-state">Идет поиск...</div>
      <div v-else-if="searched && searchResults.length === 0" class="empty-state">
        Пользователи не найдены.
      </div>
      <ul v-else-if="searchResults.length > 0" class="results-list">
        <li v-for="user in searchResults" :key="user.id" class="result-item">
          <router-link :to="`/profile/${user.telegram_id}`" class="user-link">
            <span class="username">{{ user.username || 'Unnamed User' }}</span>
            <span class="wallet">{{ formatAddress(user.wallet_address) }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { RouterLink } from 'vue-router';

const searchQuery = ref('');
const searchResults = ref([]);
const isLoading = ref(false);
const searched = ref(false); // To track if a search has been performed

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;
  isLoading.value = true;
  searched.value = true;
  searchResults.value = [];
  try {
    const response = await axios.get(`/api/search?q=${searchQuery.value}`);
    searchResults.value = response.data;
  } catch (error) {
    console.error("Search failed:", error);
    alert("Произошла ошибка во время поиска.");
  } finally {
    isLoading.value = false;
  }
};

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
</script>

<style scoped>
.view-container {
  padding: 1rem;
}
.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.search-input {
  flex-grow: 1;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-color);
  background-color: #2a2a2a;
  color: var(--text-color);
  font-size: 1rem;
}
.search-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--accent-color-green);
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.results-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.user-link {
  display: block;
  padding: 1rem;
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-color);
  transition: background-color 0.2s;
}
.user-link:hover {
  background-color: #333;
}
.username {
  font-weight: 600;
}
.wallet {
  display: block;
  font-size: 0.8rem;
  color: var(--secondary-text-color);
  margin-top: 0.25rem;
  font-family: monospace;
}
.loading-state, .empty-state {
  text-align: center;
  color: var(--secondary-text-color);
  padding: 2rem;
}
</style>
