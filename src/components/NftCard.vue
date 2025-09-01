<template>
  <div class="nft-card">
    <img :src="imageUrl" :alt="nft.name" class="nft-image" @error="onImageError" />
    <div class="nft-info">
      <p class="nft-name">{{ nft.name || 'Untitled' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  nft: {
    type: Object,
    required: true,
  },
});

// A fallback image in case the NFT's image fails to load
const fallbackImage = 'https://via.placeholder.com/300?text=NFT';

// Find the best preview image from the `previews` array, or use a fallback
const imageUrl = computed(() => {
  if (!props.nft.previews || props.nft.previews.length === 0) {
    return fallbackImage;
  }
  // Prefer a medium-sized preview if available
  const mediumPreview = props.nft.previews.find(p => p.resolution === '500x500');
  return mediumPreview ? mediumPreview.url : props.nft.previews[0].url;
});

const onImageError = (event) => {
  event.target.src = fallbackImage;
};
</script>

<style scoped>
.nft-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.nft-card:hover {
  transform: translateY(-5px);
}

.nft-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background-color: #333;
}

.nft-info {
  padding: 1rem;
}

.nft-name {
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
