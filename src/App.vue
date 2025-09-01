<script setup>
import TabBar from './components/TabBar.vue'
</script>

<template>
  <div class="app-wrapper">
    <main class="main-content">
      <!-- This component will render the view for the current route -->
      <router-view />
    </main>
    <TabBar />
  </div>
</template>

<style>
/* These are global styles for the main layout */
.app-wrapper {
  display: flex;
  flex-direction: column;
  /* Using min-height to ensure it at least fills the screen */
  min-height: 100vh;
  background-color: var(--background-color);
}

.main-content {
  flex-grow: 1;
  padding: 1rem;
  /* Add padding to the bottom to avoid content being hidden by the fixed tab bar */
  padding-bottom: 80px; /* Tab bar is 60px high, plus 20px margin */
}
</style>
