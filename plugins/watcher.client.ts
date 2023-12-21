import { watchAccount } from 'use-wagmi/actions';

export default defineNuxtPlugin(() => {
  const { resetPxNfts } = usePollinationX();
  const { initializeEncryptor } = useEncryptor();
  const { initializeMailClient } = useMail();
  const { address } = useAccount();
  const { chain } = useWagmiNetwork();
  const route = useRoute();

  initializeEncryptor();
  initializeMailClient();

  watch([chain, address], () => {
    initializeEncryptor();
    initializeMailClient();
    resetPxNfts();
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
