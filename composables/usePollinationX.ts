import { type Address } from 'viem';
import { parseEther, toHex } from 'viem';
import { prepareWriteContract, waitForTransaction, writeContract } from '@wagmi/core';
import { useToast } from 'vue-toastification';
import { PollinationX } from '@4thtech-sdk/storage';
import pollinationXAbi from '~/assets/abi/pollination-x.json';
import type { GetNft, Nft, NftPackage, PollinationXConfig } from '~/types/pollination-x';

export function usePollinationX() {
  const { address } = useAccount();
  const chainId = useChainId();
  const runtimeConfig = useRuntimeConfig();
  const { signMessageAsync } = useSignMessage();
  const toast = useToast();

  const pollinationXConfig: PollinationXConfig = {
    url: 'https://6cp0k0.pollinationx.io',
    authMessage:
      'This request will check your PollinationX storage NFT and it will not trigger a blockchain transaction or cost any gas fees.',
  };

  const pollinationXClient = useState<PollinationX>('pollination-x-client');
  const pxNfts = useState<GetNft>('px-nfts');
  const primaryNft = useState<Nft>('primary-nft');
  const pxNftPackages = useState<NftPackage[]>('nft-packages', () => [
    { id: 1, size: 5, price: '0.005' },
    { id: 2, size: 10, price: '0.01' },
    { id: 3, size: 20, price: '0.02' },
    { id: 4, size: 100, price: '0.1' },
  ]);

  const isNftIntegrationEnabled = !(runtimeConfig.public.pollinationX.url && runtimeConfig.public.pollinationX.token);

  const initializePollinationXClient = () => {
    const endpoint = isNftIntegrationEnabled ? primaryNft.value?.endpoint : runtimeConfig.public.pollinationX.url;
    const token = isNftIntegrationEnabled ? primaryNft.value?.jwt : runtimeConfig.public.pollinationX.token;

    pollinationXClient.value = new PollinationX(endpoint, token);
  };

  const disconnectPollinationX = () => {
    pxNfts.value = {
      nfts: [],
      success: false,
      contractAddress: '',
      symbol: '',
    };
  };

  const setPrimaryNft = (nft: Nft) => {
    primaryNft.value = nft;
    initializePollinationXClient();
  };

  const fetchUserNfts = async () => {
    if (!address.value) {
      return;
    }

    const signature = await signMessageAsync({ message: pollinationXConfig.authMessage });

    const queryParams = new URLSearchParams({
      wallet: address.value,
      chain: toHex(chainId.value),
      nonce: pollinationXConfig.authMessage,
      signature,
    });

    const response = await fetch(`${pollinationXConfig.url}/auth/login?${queryParams.toString()}`, {
      method: 'GET',
    });

    return response.json();
  };

  const connectStorageNft = async () => {
    pxNfts.value = await fetchUserNfts().catch((error) => toast.error(error.message));

    if (pxNfts.value.error) {
      toast.error(pxNfts.value.error);
    } else if (pxNfts.value.nfts?.length) {
      setPrimaryNft(pxNfts.value.nfts[0]);
    }
  };

  const mintNft = async (nftPackage?: NftPackage) => {
    toast.info('Minting in progress');

    const isFreeMint = !nftPackage;
    const nftPackageId = isFreeMint ? 0 : nftPackage.id;
    const nftPackagePrice = isFreeMint ? 0n : parseEther(nftPackage.price);

    try {
      const res = await doWriteContract('mint', [nftPackageId], nftPackagePrice);

      if (res.status === 'success') {
        toast.success('Minted');
        await connectStorageNft();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const upgradeNft = async (selectedNftForUpgrade: Nft, nftPackage: NftPackage) => {
    toast.info('Upgrading PX sNFT in progress');

    try {
      const res = await doWriteContract(
        'upgradeTokenPackage',
        [parseInt(selectedNftForUpgrade.id.tokenId), nftPackage.id],
        parseEther(nftPackage.price),
      );

      if (res.status === 'success') {
        toast.success('Minted');
        await connectStorageNft();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const doWriteContract = async (functionName: string, args: any[], value: bigint = 0n) => {
    const config = await prepareWriteContract({
      address: pxNfts.value.contractAddress as Address,
      abi: pollinationXAbi,
      functionName,
      args: [...args],
      value,
    });

    const { hash } = await writeContract(config);

    return waitForTransaction({
      confirmations: 1,
      hash,
    });
  };

  return {
    pollinationXClient,
    isNftIntegrationEnabled,
    pxNfts,
    pxNftPackages,
    primaryNft,
    connectStorageNft,
    mintNft,
    setPrimaryNft,
    upgradeNft,
    disconnectPollinationX,
    initializePollinationXClient,
  };
}
