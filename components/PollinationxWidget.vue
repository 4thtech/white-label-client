<script setup lang="ts">
import { useToast } from 'vue-toastification';

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

const toast = useToast();
const { initializeMailClient } = useMail();
const { getNfts, nftStore, mintFreePxNft, mintPxNft, pxXNfts, pxNftPackages, upgradePxNftPackage } = usePollinationX();
const packageModalOpen = useState<boolean>('is-modal-active', () => false);
const upgradeNft = useState<string>();
const mainSelectedNft = useState<any>();
nftStore.nftsRes = pxXNfts.value;


const mintFreeNft = async () => {
  toast.info("Minting in progress")
  const res = await mintFreePxNft().catch((error) => toast.error(error.message));
  if (!res?.error) {
    toast.success("Minted")
    await connectStorageNft();
  }
  else{
    toast.error(res.error.message)
  }
};
const mintNftModal = async () => {
  upgradeNft.value = "";
  mainSelectedNft.value = false;
  packageModalOpen.value = true;
};
const upgradeNftModal = async (selectedNft) => {
  upgradeNft.value = `${selectedNft.title} (Size: ${selectedNft.metadata.attributes[1].value}, Usage ${selectedNft.metadata.attributes[0].value}%)`;
  mainSelectedNft.value = selectedNft;
  let selectedPackageSize = selectedNft.metadata.attributes[1].value.replace(/\D/g, '');

  if(selectedNft.metadata.attributes[1].value.includes('MB')){
    selectedPackageSize = 0;
  }
  pxNftPackages.value.forEach(item => {
    if(item.size <= selectedPackageSize){
      item.disabled = true;
    }
  });
  packageModalOpen.value = true;
};

const mintNft = async (nftPackage) => {
  pxNftPackages.value.forEach(item => {
    item.processing = false;
    item.disabled = true;
  });
  nftPackage.processing = true;
  toast.info("Minting in progress")
  const res = await mintPxNft(nftPackage.id, nftPackage.price).catch((error) => toast.error(error.message));
  if (!res?.error) {
    toast.success("Minted")
    closeModal();
    await connectStorageNft();
  }
  else{
    toast.error(res.error.message)
  }
};
const upgradeMintNft = async (nftPackage) => {
  pxNftPackages.value.forEach(item => {
    item.processing = false;
    item.disabled = true;
  });
  nftPackage.processing = true;
  toast.info("Upgrading PX storage dNFT in progress")
  const res = await upgradePxNftPackage(mainSelectedNft.value.id.tokenId, nftPackage.id, nftPackage.price).catch((error) => toast.error(error.message));
  if (!res?.error) {
    toast.success("Upgraded")
    closeModal();
    await connectStorageNft();
  }
  else{
    toast.error(res.error.message)
  }

};
const connectStorageNft = async () => {
  nftStore.nftsRes = await getNfts().catch((error) => toast.error(error.message));
  if (!nftStore.nftsRes?.error) {
    nftStore.nftsRes.nfts[0].isDefault = true;
    initializeMailClient(nftStore.nftsRes.nfts[0].endpoint,nftStore.nftsRes.nfts[0].jwt)
  }
  else{
    toast.error(nftStore.nftsRes.error)
  }
};
const setDefault = async (nft) => {
  nftStore.nftsRes.nfts.forEach(item => {
    item.isDefault = false;
  });
  nft.isDefault = true;
  initializeMailClient(nft.endpoint, nft.jwt)
};

const closeModal = () => {
  packageModalOpen.value = false;
  pxNftPackages.value.forEach(item => {
    item.processing = false;
    item.disabled = false;
  });
};

const pollinationxWidget = computed(() => {

  if(nftStore.nftsRes.success && nftStore.nftsRes.nfts.length == 0){

    return {
      title: 'PollinationX Storage On-Demand',
      text: 'Connected',
      button: {
        text: 'Mint your FREE 100MB PX storage dNFT',
        mintFree: true,
        click: () => mintFreeNft(),
      },
    };
  }
  else if(!nftStore.nftsRes.success){
    return {
      title: 'PollinationX Storage On-Demand',
      text: '',
      button: {
        mintFree: false,
        text: 'Connect storage PX dNFT',
        click: () => connectStorageNft(),
      },
    };
  }
  else{
    return {
      title: 'PollinationX Storage On-Demand',
      text: 'Connected',
      button: {
        mintFree: false,
        text: 'Buy new PX storage dNFT',
        click: () => mintNftModal(),
      },
    };
  }
});

const pollinationxModalInfo = computed(() => {

  if(upgradeNft.value){
    return {
      title: 'Upgrade existing PX storage dNFT',
      upgrade: true
    };
  }
 else{
    return {
      title: 'Mint new PX storage dNFT',
      upgrade: false
    };
  }

});
</script>

<template>
  <BaseCard class="p-6" :color="color">
    <div class="group relative">
      <div class="py-6">
        <div class="relative">
          <img
            class="relative z-10 mx-auto max-w-[100px]"
            src="/img/logos/pxIcon.svg"
            :alt="pollinationxWidget.title"
          />
          <div
            class="absolute start-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 transition-transform duration-300 group-hover:scale-150"
          ></div>
        </div>
      </div>
      <div class="text-center">
        <BaseHeading as="h3" size="md" weight="medium" lead="tight" class="mb-1 text-muted-800 dark:text-white">
          <span>{{ pollinationxWidget.title }}</span>
        </BaseHeading>
        <BaseParagraph size="xs">
          <span class="text-muted-400">{{ pollinationxWidget.text }}</span>
        </BaseParagraph>
      </div>
      <div v-if="pollinationxWidget.button" class="mt-4 text-center">
        <BaseButton
          target="_blank"
          class="w-full max-w-sm"
          color="primary"
          @click.passive="pollinationxWidget.button.click"
        >
          <Icon name="ph:cursor-click" class="h-5 w-5" />
          <span>{{ pollinationxWidget.button.text }}</span>
        </BaseButton>
      </div>
      <div v-if="nftStore.nftsRes && nftStore.nftsRes.nfts" class="mt-4 text-center">
        <BaseParagraph size="xs" v-if="nftStore.nftsRes.nfts.length > 0">
          <span class="text-muted-400">Click to select default PX storage dNFT ↓</span>
        </BaseParagraph>
        <ul class="nft-list mt-2">
          <li
            v-for="nft in nftStore.nftsRes.nfts"
            :key="nft.id"
            @click="setDefault(nft)"
            :class="{ 'default-selection': nft.isDefault }"
          >
            <div class="nft-item">
              <img width="15" src="/img/logos/pxIcon.svg" :alt="pollinationxWidget.title" class="nft-favicon mr-2" />
              <img width="15" src="/img/edit.png" :alt="pollinationxWidget.title" class="nft-edit-icon mr-2" @click="upgradeNftModal(nft)" />
              <BaseParagraph size="xs">
                {{ nft.title }} (Size: {{ nft.metadata.attributes[1].value }}, Usage {{ nft.metadata.attributes[0].value }}%)
              </BaseParagraph>
            </div>
          </li>
        </ul>
      </div>
      <div v-else>
        <div v-if="pollinationxWidget.button && pollinationxWidget.button.mintFree" class="mt-4 text-center">
          <BaseButton
            target="_blank"
            class="w-full max-w-sm"
            color="primary"
            @click.passive="pollinationxWidget.button.click"
          >
            <Icon name="ph:cursor-click" class="h-5 w-5" />
            <span>{{ pollinationxWidget.button.text }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
  <ModalDialog v-if="packageModalOpen" :open="packageModalOpen" size="sm" @close="closeModal">
      <div class="flex w-full items-center justify-between p-4 md:p-6">
        <h3 class="font-heading text-lg font-medium leading-6 text-muted-900 dark:text-white">{{ pollinationxModalInfo.title }}</h3>
        <BaseButtonClose @click="closeModal" />
      </div>
      <BaseParagraph v-if="pollinationxModalInfo.upgrade" size="xs" class="text-center">
        <span class="text-muted-400">
          Upgrading: {{ upgradeNft }}
        </span>
      </BaseParagraph>
    <div class="package-wrapper">
      <div v-for="nftPackage in pxNftPackages" :key="nftPackage.id" class="package-container">
        <div v-if="pollinationxModalInfo.upgrade" :class="{ 'disabled': nftPackage.disabled }"  @click="!nftPackage.disabled && upgradeMintNft(nftPackage)">
          <img width="25" src="/img/logos/pxIcon.svg" :class="{ 'logoPackages': nftPackage.processing, 'mx-auto': true, 'mb-2': true }"/>
          <div class="package-details">
            <p class="text-sm">Size: {{ nftPackage.size }} GB</p>
            <p class="text-sm">Price: {{ nftPackage.price }} {{ nftStore.nftsRes.symbol }}</p>
          </div>
        </div>
        <div v-else :class="{ 'disabled': nftPackage.disabled }"  @click="!nftPackage.disabled && mintNft(nftPackage)">
          <img width="25" src="/img/logos/pxIcon.svg" :class="{ 'logoPackages': nftPackage.processing, 'mx-auto': true, 'mb-2': true }"/>
          <div class="package-details">
            <p class="text-sm">Size: {{ nftPackage.size }} GB</p>
            <p class="text-sm">Price: {{ nftPackage.price }} {{ nftStore.nftsRes.symbol }}</p>
          </div>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.nft-list {
  list-style-type: none;
  padding: 0;
}
.nft-item {
  display: flex;
  padding: 8px;
  cursor: pointer;
}
.default-selection {
  position: relative;
  background-color: rgba(34, 51, 81, 0.6);
}
.default-selection:before {
 content: '✓';
  color: green;
  margin-left: 5px;
  position: absolute;
  right: 10px;
  bottom: 3px;
  font-size: 20px;
}
.nft-item:hover {
  background-color: rgba(34, 51, 81, 0.6);
}
.package-wrapper{
  display: flex;
  flex-wrap: wrap;
}
.package-container {
  flex: 40%;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 16px;
  text-align: center;
  box-sizing: border-box;
  margin:10px;
  cursor: pointer;
}
.package-container:hover{
  background-color: rgba(34, 51, 81, 0.6);
}
.logoPackages {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(360deg);
  }
}
.package-container .disabled{
  opacity: 0.3;
}

</style>
