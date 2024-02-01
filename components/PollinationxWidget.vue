<script setup lang="ts">
import type { Nft, NftPackage } from '~/types/pollination-x';

defineProps<{
  color?:
    | 'white'
    | 'white-contrast'
    | 'muted'
    | 'muted-contrast'
    | 'primary'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'none';
}>();

const { pxNfts, pxNftPackages, primaryNft, connectStorageNft, mintNft, setPrimaryNft, upgradeNft } = usePollinationX();

const nftPackagesModalOpen = ref(false);
const selectedNftForUpgrade = ref<Nft>();
const processingNftPackageIds = ref<Set<number>>(new Set());

const openNftPackagesModal = (nftForUpgrade?: Nft) => {
  selectedNftForUpgrade.value = nftForUpgrade;
  nftPackagesModalOpen.value = true;
};

const closeModal = () => {
  nftPackagesModalOpen.value = false;
};

const handleNftPackageClick = (nftPackage: NftPackage) => {
  if (isNftPackageDisabled.value(nftPackage)) {
    return;
  }

  processingNftPackageIds.value.add(nftPackage.id);

  const action = selectedNftForUpgrade.value
    ? upgradeNft(selectedNftForUpgrade.value, nftPackage)
    : mintNft(nftPackage);

  action.then(() => {
    processingNftPackageIds.value.delete(nftPackage.id);
    closeModal();
  });
};

const isNftPackageDisabled = computed(() => (nftPackage: NftPackage) => {
  // Disable all packages if any package being processed
  if (processingNftPackageIds.value.size) {
    return true;
  }

  // We don't disable nft packages if we are buying a new nft
  if (!selectedNftForUpgrade.value) {
    return false;
  }

  // If we have a selected nft for upgrade, we can't downgrade it
  let selectedNftSize = selectedNftForUpgrade.value.metadata.attributes[1].value.replace(/\D/g, '');

  if (selectedNftForUpgrade.value.metadata.attributes[1].value.includes('MB')) {
    selectedNftSize = 0;
  }

  return nftPackage.size <= selectedNftSize;
});

const pollinationXWidget = computed(() => {
  if (!pxNfts.value?.success) {
    return {
      title: 'PollinationX Storage On-Demand',
      text: '',
      button: {
        text: 'Connect PX sNFTs',
        click: () => connectStorageNft(),
      },
    };
  }
  if (!pxNfts.value?.nfts?.length) {
    return {
      title: 'PollinationX Storage On-Demand',
      text: 'Connected',
      button: {
        text: 'Mint your FREE 100MB PX sNFT',
        click: () => mintNft(),
      },
    };
  }

  return {
    title: 'PollinationX Storage On-Demand',
    text: 'Connected',
    button: {
      text: 'Buy new PX sNFT',
      click: () => openNftPackagesModal(),
    },
  };
});

const pollinationXModalInfo = computed(() => ({
  title: selectedNftForUpgrade.value ? 'Upgrade existing PX sNFT' : 'Mint new PX sNFT',
}));
</script>

<template>
  <BaseCard class="p-6" :color="color">
    <div class="group relative">
      <div class="py-6">
        <div class="relative">
          <img
            class="relative z-10 mx-auto max-w-[100px]"
            src="/img/logos/pollination-x-icon.svg"
            :alt="pollinationXWidget.title"
          />
          <div
            class="absolute start-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 transition-transform duration-300 group-hover:scale-150"
          ></div>
        </div>
      </div>
      <div class="text-center">
        <BaseHeading as="h3" size="md" weight="medium" lead="tight" class="mb-1 text-muted-800 dark:text-white">
          <span>{{ pollinationXWidget.title }}</span>
        </BaseHeading>
        <BaseParagraph size="xs">
          <span class="text-muted-400">{{ pollinationXWidget.text }}</span>
        </BaseParagraph>
      </div>
      <div v-if="pollinationXWidget.button" class="mt-4 text-center">
        <BaseButton
          target="_blank"
          class="w-full max-w-sm"
          color="primary"
          @click.passive="pollinationXWidget.button.click"
        >
          <Icon name="ph:cursor-click" class="h-5 w-5" />
          <span>{{ pollinationXWidget.button.text }}</span>
        </BaseButton>
      </div>
      <div v-if="pxNfts?.nfts?.length" class="mt-4 text-center">
        <BaseParagraph size="xs">
          <span class="text-muted-400">Click to select default PX sNFT ↓</span>
        </BaseParagraph>
        <ul class="mt-2">
          <li
            v-for="(nft, index) in pxNfts.nfts"
            :key="index"
            :class="{ 'bg-muted-100/80 dark:bg-muted-700/60': nft === primaryNft }"
            @click="setPrimaryNft(nft)"
          >
            <div class="flex cursor-pointer p-2 hover:bg-muted-100/80 dark:hover:bg-muted-700/60">
              <img src="/img/logos/pollination-x-icon.svg" :alt="pollinationXWidget.title" class="mr-2 h-5 w-5" />
              <Icon
                name="ph:note-pencil"
                class="mr-2 h-5 w-5 text-muted-500 hover:text-muted-600 dark:text-muted-400/80 dark:hover:text-muted-200"
                @click="openNftPackagesModal(nft)"
              />
              <BaseParagraph size="xs">
                {{ nft.title }} (Size: {{ nft.metadata.attributes[1].value }}, Usage
                {{ nft.metadata.attributes[0].value }}%)
              </BaseParagraph>
              <Icon
                v-if="nft === primaryNft"
                name="feather:check"
                class="ml-auto h-5 w-5 text-success-500 dark:text-success-400"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </BaseCard>
  <ModalDialog v-if="nftPackagesModalOpen" :open="nftPackagesModalOpen" size="sm" @close="closeModal">
    <div class="flex w-full items-center justify-between p-4 md:p-6">
      <h3 class="font-heading text-lg font-medium leading-6 text-muted-900 dark:text-white">
        {{ pollinationXModalInfo.title }}
      </h3>
      <BaseButtonClose @click="closeModal" />
    </div>
    <BaseParagraph v-if="selectedNftForUpgrade" size="xs" class="pb-4 text-center">
      <span class="text-muted-400">
        Upgrading:
        {{
          `${selectedNftForUpgrade.title}
          (Size: ${selectedNftForUpgrade.metadata.attributes[1].value},
          Usage ${selectedNftForUpgrade.metadata.attributes[0].value}%)`
        }}
      </span>
    </BaseParagraph>
    <div class="grid grid-cols-2 gap-2 p-4 pt-0">
      <div
        v-for="nftPackage in pxNftPackages"
        :key="nftPackage.id"
        class="cursor-pointer rounded-xl border border-muted-200 p-4 text-center hover:bg-muted-100 dark:border-muted-700 hover:dark:bg-muted-900"
      >
        <div
          :class="{
            'cursor-not-allowed opacity-30': isNftPackageDisabled(nftPackage),
          }"
          @click="handleNftPackageClick(nftPackage)"
        >
          <img
            src="/img/logos/pollination-x-icon.svg"
            :class="{ 'animate-spin': processingNftPackageIds.has(nftPackage.id) }"
            class="mx-auto mb-2 h-8 w-8"
            alt="PollinationX icon"
          />
          <div>
            <span class="block text-sm">Size: {{ nftPackage.size }} GB</span>
            <span class="block text-sm">Price: {{ nftPackage.price }} {{ pxNfts?.symbol }}</span>
          </div>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>
