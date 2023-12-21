import axios, { AxiosInstance } from 'axios'
import * as ethers from 'ethers'
import { reactive } from 'vue';
import { prepareWriteContract, writeContract, Address, waitForTransaction, readContract } from '@wagmi/core'
import abiPX from '../src/abi/PX.json'

export function usePollinationX() {

   interface IPollinationXConfig {
    url: string
    authMessage: string
  }

   const pollinationXConfig: IPollinationXConfig = {
     url: 'https://6cp0k0.pollinationx.io',
     authMessage:  'This request will check your PollinationX storage NFT and it will not trigger a blockchain transaction or cost any gas fees.',
  }
  interface IError {
    error?: any
  }
  const httpClient: AxiosInstance = axios.create({
    baseURL: pollinationXConfig.url
  })
  interface IContract {
    address: string
  }
  interface IContractMetadata {
    contractDeployer: string
    deployedBlockNumber: number
    name: string
    openSea: IOpenSea
    symbol: string
    tokenType: string
  }
  interface IOpenSea {
    lastIngestedAt: string
  }
  interface IToken {
    tokenId: string
    tokenMetadata: ITokenMetadata
  }
  interface ITokenMetadata {
    tokenType: string
  }
  interface IMedia {
    bytes: number
    format: string
    gateway: string
    raw: string
    thumbnail: string
  }
  interface IMetadataAttribute {
    display_type?: string
    trait_type: string
    value: string | number
  }
  interface IMetadata {
    attributes: IMetadataAttribute[]
    description: string
    image: string
    name: string
  }
  interface ITokenUri {
    gateway: string
    raw: string
  }

  interface INft {
    balance: string
    contract: IContract
    contractMetadata: IContractMetadata
    description: string
    endpoint: string
    id: IToken
    jwt: string
    media?: IMedia[]
    metadata: IMetadata
    timeLastUpdated: string
    title: string
    tokenUri: ITokenUri
    secret?: string
    cid?: string
    synced?: boolean
  }
  interface IGetNft extends IError {
    nfts?: INft[]
    success?: boolean
    totalCount?: number
    contractAddress?: string
    symbol?: string
  }

  interface ISignAuth {
    chain: string
    nonce: string
    signature: string
  }

  const { address } = useAccount();

  const pxXNfts = useState<IGetNft>();
  interface INftPackage {
    id: number
    size: number
    price: number
    disabled: boolean
    processing: boolean
    done: boolean
  }
  const pxNftPackages = ref([
    { id: 1, size: 5, price: 0.005, disabled: false, processing: false, done: false },
    { id: 2, size: 10, price: 0.01, disabled: false, processing: false, done: false },
    { id: 3, size: 20, price: 0.02, disabled: false, processing: false, done: false },
    { id: 4, size: 100, price: 0.1, disabled: false, processing: false, done: false }
  ]);

  const defaultNftState: IGetNft = {
    nfts: [],
    success: false,
    totalCount: 0,
    contractAddress: '',
    symbol: '',
  };

  const resetPxNfts = () => {
    return pxXNfts.value = defaultNftState;
  }
  const getNfts = async () => {
    try {
      const { chain, nonce, signature } = await doSignMessage(pollinationXConfig.authMessage)
      const response = await httpClient.get('/auth/login', {
        params: {
          wallet: address.value,
          chain,
          nonce,
          signature
        }
      });

      pxXNfts.value = response.data

      return response.data;

    } catch (error) {
      return { error }
    }
  }
  const doSignMessage = async (message: string): Promise<ISignAuth> => ({
    chain: await window.ethereum.request({ method: 'eth_chainId' }),
    nonce: message,
    signature: await (await new ethers.BrowserProvider(window.ethereum).getSigner()).signMessage(message)
  })

  const mintFreePxNft = async () => {
    return await doWriteContract(
      'mint',
      [0],
      { value: ethers.parseUnits('0', 18), gasLimit: BigInt(4000000)  },
      pxXNfts.value.contractAddress
    )
  }
  const mintPxNft = async (packageId, packagePrice) => {
    return await doWriteContract(
      'mint',
      [packageId],
      { value: ethers.parseUnits(packagePrice.toString(), 18), gasLimit: BigInt(4000000)  },
      pxXNfts.value.contractAddress
    )
  }
  const upgradePxNftPackage = async (tokenId, packageId, packagePrice) => {
    return await doWriteContract(
      'upgradeTokenPackage',
      [parseInt(tokenId), packageId],
      { value: ethers.parseUnits(packagePrice.toString(), 18), gasLimit: BigInt(4000000) },
      pxXNfts.value.contractAddress
    )
  }
  const getTokenUri = async (tokenId) => {
    return await doReadContract(
      'tokenURI',
      [parseInt(tokenId)],
      pxXNfts.value.contractAddress
    )
  }

  const doWriteContract = async (functionName: string, args: any[], overrides?: any, address?: string, abi?: any[]): Promise<any> => {
    try {
      const config = await prepareWriteContract({
        address: address as Address,
        abi: abi || abiPX,
        functionName,
        args: [...args],
        value: overrides.value,
        gasLimit: overrides.gasLimit,
      })

      const { hash } = await writeContract(config)

      return await waitForTransaction({
        confirmations: 1,
        hash,
      })
    } catch (error) {
      return { error }
    }
  }
  const doReadContract = async (functionName: string, args: any[], address?: string, abi?: any[]): Promise<any> => {
    try {
      return await readContract({
        address: address as Address,
        abi: abi || abiPX,
        functionName,
        args: [...args]
      })
    } catch (error) {
      return { error }
    }
  }

  return {
    mintFreePxNft,
    mintPxNft,
    getNfts,
    pxXNfts,
    pxNftPackages,
    upgradePxNftPackage,
    resetPxNfts
  };
}
