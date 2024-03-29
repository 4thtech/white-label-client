import { watchAccount } from 'use-wagmi/actions';

export default defineNuxtPlugin(() => {
  const { primaryNft, disconnectPollinationX, initializePollinationXClient } = usePollinationX();
  const { initializeEncryptor } = useEncryptor();
  const { initializeMailClient } = useMail();
  const { initializeChatClient } = useChat();
  const { address } = useAccount();
  const { chain } = useWagmiNetwork();
  const route = useRoute();

  initializeEncryptor();
  initializePollinationXClient();
  initializeMailClient();
  initializeChatClient();

  watch([chain, address], () => {
    initializeEncryptor();
    initializeMailClient();
    initializeChatClient();
    disconnectPollinationX();
  });

  watch([primaryNft], () => {
    initializeMailClient();
  });

  watchAccount((account) => {
    const isAtHomePage = route.name === 'index';
    const shouldRedirectToHome = !isAtHomePage && account.isDisconnected;
    const shouldRedirectToDashboard = isAtHomePage && account.isConnected;

    if (shouldRedirectToHome) {
      navigateTo('/');
    } else if (shouldRedirectToDashboard) {
      navigateTo('/dashboard');
    }
  });
});
