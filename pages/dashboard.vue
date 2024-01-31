<script setup lang="ts">
definePageMeta({
  title: 'Dashboard',
});

const { isNftIntegrationEnabled } = usePollinationX();
</script>

<template>
  <div class="mb-7 grid gap-6 sm:grid-cols-3 ptablet:grid-cols-2">
    <!-- Account widget -->
    <div class="relative">
      <AccountDataWidget />
    </div>
    <!-- Encryptor widget -->
    <div class="relative">
      <EncryptorWidget />
    </div>
    <!-- PollinationX widget -->
    <div v-if="isNftIntegrationEnabled" class="relative">
      <PollinationxWidget />
    </div>
  </div>
</template>
