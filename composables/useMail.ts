import type { ReceivedEnvelope } from '@4thtech-sdk/types';
import { Mail } from '@4thtech-sdk/ethereum';
import { PollinationX } from '@4thtech-sdk/storage';
import { EncryptionHandler } from '@4thtech-sdk/encryption';
import { useToast } from 'vue-toastification';

export function useMail() {
  const { address } = useAccount();
  const runtimeConfig = useRuntimeConfig();
  const toast = useToast();

  const mailClient = useState<Mail>('mail-client');
  const isLoading = useState<boolean>('fetch-all-loading', () => false);
  const receivedEnvelopes = useState<ReceivedEnvelope[]>('received-envelopes', () => []);
  const unwatchOnNew = useState<Function>('unwatch-on-new');

  const initializeRemoteStorageProvider = (url?: string, token?: string) => {
    return new PollinationX(url || runtimeConfig.public.pollinationX.url, token || runtimeConfig.public.pollinationX.token);
  };

  const initializeEncryptionHandler = () => {
    const { encryptorAesEncryption } = useEncryption();

    return new EncryptionHandler({
      encryptionImplementations: [encryptorAesEncryption],
    });
  };

  const initializeMailClient = (url?: string, token?: string) => {
    const { walletClient } = useWallet();

    if (!walletClient.chain?.contracts?.mail) {
      return;
    }

    const remoteStorageProvider = initializeRemoteStorageProvider(url, token);
    const encryptionHandler = initializeEncryptionHandler();

    mailClient.value = new Mail({
      walletClient,
      remoteStorageProvider,
      encryptionHandler,
    });

    fetchAll();
    listenForMailEvents();
  };

  const fetchAll = () => {
    if (address.value) {
      isLoading.value = true;
      mailClient.value.fetchAll(address.value).then((envelopes) => {
        receivedEnvelopes.value = envelopes.reverse();
        isLoading.value = false;
      });
    }
  };

  const listenForNewEnvelopes = () => {
    if (address.value) {
      unwatchOnNew.value = mailClient.value?.onNew(null, address.value, (envelope) => {
        receivedEnvelopes.value.unshift(envelope);
        toast.info('New mail in inbox.', { timeout: 15000 });
      });
    }
  };

  const listenForMailEvents = () => {
    // First remove previous listeners
    stopListeningForMailEvents();

    // Then add new listeners
    listenForNewEnvelopes();
  };

  const stopListeningForMailEvents = () => {
    unwatchOnNew.value?.();
  };

  return {
    mailClient: mailClient.value,
    isLoading,
    receivedEnvelopes,
    initializeMailClient,
  };
}
