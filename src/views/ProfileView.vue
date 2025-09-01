<template>
  <div class="view-container">
    <!-- Title changes based on context -->
    <h2 v-if="isMyProfile">Мой профиль</h2>
    <h2 v-else>Профиль пользователя</h2>

    <!-- "My Profile" specific connection section -->
    <div v-if="isMyProfile" class="connection-section">
      <p>Подключите кошелек для просмотра своего профиля.</p>
      <TonConnectButton class="connect-button" />
    </div>

    <!-- Details section, shown for both my profile (if connected) and others' profiles -->
    <div v-if="!isMyProfile || wallet" class="profile-details">
      <div class="wallet-info">
        <h3>Кошелек пользователя:</h3>
        <p class="wallet-address">{{ userFriendlyAddress }}</p>
      </div>

      <hr />

      <div class="nft-gallery">
        <h3>Коллекция NFT:</h3>
        <div v-if="isLoading" class="loading">Загрузка NFT...</div>
        <div v-else-if="nfts.length > 0" class="nft-grid">
          <NftCard v-for="nft in nfts" :key="nft.address" :nft="nft" />
        </div>
        <div v-else class="empty-state">У этого пользователя нет NFT.</div>
      </div>
    </div>

    <div v-if="isMyProfile && !wallet" class="please-connect">
      <p>Информация о профиле появится после подключения кошелька.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, toRefs } from 'vue';
import { TonConnectButton, useTonWallet } from '@ton-connect/ui-vue';
import axios from 'axios';
import NftCard from '../components/NftCard.vue';

// --- Props & Route Handling ---
const props = defineProps({
  telegram_id: String,
});
const { telegram_id: routeTelegramId } = toRefs(props);
const isMyProfile = computed(() => !routeTelegramId.value);

// --- Reactive State ---
const wallet = useTonWallet(); // From TON Connect, for "My Profile" view
const nfts = ref([]);
const isLoading = ref(false);
const viewedUser = ref(null); // For storing data of another user's profile

// --- Computed Properties ---
const userFriendlyAddress = computed(() => {
  // Use the other user's address if we are on their profile, otherwise use my connected wallet
  const address = !isMyProfile.value ? viewedUser.value?.wallet_address : wallet.value?.address;
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
});

const myTelegramUser = computed(() => window.Telegram?.WebApp?.initDataUnsafe?.user || { id: 1234567890, username: 'dev_user' });

// --- Main Data Fetching Function ---
async function fetchDataForUser(targetId) {
  if (!targetId) return;
  isLoading.value = true;
  nfts.value = [];
  viewedUser.value = null;
  try {
    // Fetch both profile data and NFTs in parallel
    const [userRes, nftsRes] = await Promise.all([
      axios.get(`/api/users/${targetId}`),
      axios.get(`/api/users/${targetId}/nfts`)
    ]);
    viewedUser.value = userRes.data;
    nfts.value = nftsRes.data;
  } catch (error) {
    console.error(`Failed to fetch data for user ${targetId}:`, error);
    alert("Не удалось загрузить данные пользователя.");
  } finally {
    isLoading.value = false;
  }
}

// --- Wallet Connection Logic (for My Profile) ---
async function connectToBackend(walletAddress) {
  if (!myTelegramUser.value) return;
  try {
    const payload = {
      telegram_id: myTelegramUser.value.id,
      username: myTelegramUser.value.username,
      wallet_address: walletAddress,
    };
    await axios.post('/api/connect', payload);
  } catch (error) {
    console.error('Error connecting to backend:', error);
  }
}

// --- Watchers ---
// This watcher reacts to route changes (e.g., /profile -> /profile/123)
watch(routeTelegramId, (newId) => {
  if (newId) {
    fetchDataForUser(newId);
  } else {
    // We are on "My Profile" page. Fetch data if wallet is connected.
    if (wallet.value) {
      fetchDataForUser(myTelegramUser.value.id);
    }
  }
}, { immediate: true });

// This watcher reacts to wallet connection events on the "My Profile" page
watch(wallet, (newWallet) => {
  if (isMyProfile.value && newWallet) {
    connectToBackend(newWallet.address).then(() => {
      fetchDataForUser(myTelegramUser.value.id);
    });
  } else if (isMyProfile.value && !newWallet) {
    // Wallet disconnected on my profile page
    nfts.value = [];
    viewedUser.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
/* Styles are largely the same, but some might need adjustment */
.view-container { padding: 1rem; }
.connection-section { margin-bottom: 2rem; text-align: center; }
.connect-button { margin-top: 1rem; }
.profile-details { margin-top: 2rem; }
.wallet-info { margin-bottom: 1rem; }
.wallet-address { font-family: monospace; background-color: var(--surface-color); padding: 0.5rem 1rem; border-radius: var(--border-radius); word-break: break-all; font-size: 1.1rem; }
.please-connect, .loading, .empty-state { margin-top: 2rem; text-align: center; color: var(--secondary-text-color); }
hr { border: none; border-top: 1px solid var(--surface-color); margin: 2rem 0; }
.nft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
</style>
