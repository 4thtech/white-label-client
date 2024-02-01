import type { EncryptorState } from '@4thtech-sdk/types';
import { Encryptor, User } from '@4thtech-sdk/ethereum';
import { EncryptorExtensionConnector } from '@4thtech-sdk/encryptor';

type EncryptorInfo = {
  isInstalled?: boolean;
  isInitialized?: boolean;
  isLocked?: boolean;
  isUnlocked?: boolean;
  getState?: EncryptorState;
  publicKey?: string;
  publicKeyType?: string;
  isPublicKeyStored?: boolean;
};

const REFRESH_INTERVAL_MS = 3_000;

export function useEncryptor() {
  const { address } = useAccount();

  const encryptorClient = useState<Encryptor>('encryptor-client');
  const encryptorExtension = useState<EncryptorExtensionConnector>('encryptor-extension');
  const userClient = useState<User>('user-client');
  const encryptorInfo = useState<EncryptorInfo>('encryptor-info', () => ({}));
  const unwatchOnEncryptionPublicKeySet = useState<Function>('unwatch-on-encryption-public-key-set');

  let timerId: number;

  const initializeEncryptor = () => {
    const { walletClient } = useWallet();

    if (!walletClient.chain?.contracts?.user) {
      return;
    }

    encryptorExtension.value = new EncryptorExtensionConnector();
    encryptorClient.value = new Encryptor({ encryptorExtension: encryptorExtension.value, walletClient });
    userClient.value = new User({ walletClient });

    fetchAndUpdateEncryptorInfo(true).then(() => {
      timerId = setInterval(fetchAndUpdateEncryptorInfo, REFRESH_INTERVAL_MS);
    });

    listenForEvents();
  };

  const fetchAndUpdateEncryptorInfo = async (onlyFirstTime: boolean) => {
    try {
      const isInstalled = await encryptorExtension.value.isInstalled();
      if (!isInstalled) {
        encryptorInfo.value = { isInstalled };
        return;
      }

      let isPublicKeyStored = false;
      if (onlyFirstTime && address.value) {
        isPublicKeyStored = await encryptorClient.value.isUserAddressInitialized(address.value);
      }

      const [isInitialized, isLocked, isUnlocked, getState, publicKey, publicKeyType] = await Promise.all([
        encryptorExtension.value.isInitialized(),
        encryptorExtension.value.isLocked(),
        encryptorExtension.value.isUnlocked(),
        encryptorClient.value.getState(),
        encryptorClient.value.getPublicKey(),
        encryptorClient.value.getPublicKeyType(),
      ]);

      Object.assign(encryptorInfo.value, {
        isInstalled,
        isInitialized,
        isLocked,
        isUnlocked,
        getState,
        publicKey,
        publicKeyType,
        isPublicKeyStored: onlyFirstTime ? isPublicKeyStored : encryptorInfo.value.isPublicKeyStored,
      });
    } catch (e) {
      // console.error('Error fetching encryptor info:', e);
    }
  };

  const listenForEncryptionPublicKeySet = () => {
    if (address.value) {
      unwatchOnEncryptionPublicKeySet.value = userClient.value?.onEncryptionPublicKeySet(
        address.value,
        (user, publicKey, publicKeyType) => {
          if (
            user === address.value &&
            publicKey === encryptorInfo.value.publicKey &&
            publicKeyType === encryptorInfo.value.publicKeyType
          ) {
            encryptorInfo.value.isPublicKeyStored = true;
          }
        },
      );
    }
  };

  const listenForEvents = () => {
    // First remove previous listeners
    stopListeningForEvents();

    // Then add new listeners
    listenForEncryptionPublicKeySet();
  };

  const stopListeningForEvents = () => {
    unwatchOnEncryptionPublicKeySet.value?.();
  };

  const isReadyToUse = computed(
    () =>
      encryptorInfo.value.isInstalled &&
      encryptorInfo.value.isInitialized &&
      encryptorInfo.value.isUnlocked &&
      encryptorInfo.value.isPublicKeyStored,
  );

  onUnmounted(() => {
    if (timerId) clearInterval(timerId);
  });

  return {
    encryptorClient: encryptorClient.value,
    userClient: userClient.value,
    encryptorInfo,
    initializeEncryptor,
    isReadyToUse,
  };
}
