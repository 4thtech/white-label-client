<script setup lang="ts">
import type { ReceivedEnvelope } from '@4thtech-sdk/types';

const props = defineProps<{
  isLoading: boolean;
  receivedEnvelopes: ReceivedEnvelope[];
}>();

const { isNftIntegrationEnabled, primaryNft } = usePollinationX();

const selectedEnvelope = useState<ReceivedEnvelope | undefined>('selected-envelope');
const isPanelActive = useState<boolean>('is-panel-active', () => false);

const search = ref('');

const filteredEnvelopes = computed(() => {
  const searchTerm = search.value.toLowerCase();

  return props.receivedEnvelopes.filter(
    (envelope) =>
      envelope.sender.toLowerCase().includes(searchTerm) ||
      envelope.content.subject.toLowerCase().includes(searchTerm) ||
      envelope.content.body?.toLowerCase().includes(searchTerm),
  );
});

const selectEnvelope = (envelope: ReceivedEnvelope) => {
  selectedEnvelope.value = envelope;
  isPanelActive.value = true;
};

const isPollinationXWidgetVisible = computed(() => isNftIntegrationEnabled && !primaryNft.value);
</script>

<template>
  <div class="flex h-full w-full flex-col bg-muted-50 pt-3 dark:bg-muted-900 lg:w-full ltablet:w-full">
    <!-- PollinationX widget -->
    <div v-if="isPollinationXWidgetVisible" class="my-auto">
      <PollinationxWidget v-if="isPollinationXWidgetVisible" color="none" />
    </div>
    <!-- Show mails if any -->
    <div v-else-if="receivedEnvelopes.length" class="overflow-y-auto">
      <!-- Head (search) -->
      <div class="h-16 w-full px-4 sm:px-8">
        <BaseInput
          v-model.trim="search"
          shape="curved"
          icon="lucide:search"
          :placeholder="`Search among ${receivedEnvelopes.length} mails`"
        />
      </div>
      <!-- Mails list -->
      <ul
        v-if="filteredEnvelopes.length"
        class="nui-slimscroll h-[calc(100%_-_64px)] space-y-2 overflow-y-auto px-4 pb-8 sm:px-8"
      >
        <li
          v-for="(envelope, index) in filteredEnvelopes"
          :key="index"
          class="duration 300 cursor-pointer rounded-xl p-4 transition-colors sm:p-6"
          :class="selectedEnvelope === envelope ? 'bg-primary-500/10' : 'hover:bg-muted-100 dark:hover:bg-muted-800'"
          @click="selectEnvelope(envelope)"
        >
          <MailInboxListItem :envelope="envelope" />
        </li>
      </ul>
      <!-- Show placeholder if there is no mail results from search -->
      <BasePlaceholderPage
        v-else
        title="No matching results"
        subtitle="Looks like we couldn't find any matching results for your search terms. Try other search terms."
      >
        <template #image>
          <img
            class="block dark:hidden"
            src="/img/illustrations/placeholders/flat/placeholder-search.svg"
            alt="Placeholder image"
          />
          <img
            class="hidden dark:block"
            src="/img/illustrations/placeholders/flat/placeholder-search-dark.svg"
            alt="Placeholder image"
          />
        </template>
      </BasePlaceholderPage>
    </div>
    <!-- Show placeholder if there is no email -->
    <div v-else-if="!isLoading" class="my-auto">
      <BasePlaceholderPage
        title="Your Inbox is Empty"
        subtitle="Your inbox is empty right now. Compose a new mail or wait for incoming mails to appear here."
      >
        <template #image>
          <img
            class="block dark:hidden"
            src="/img/illustrations/placeholders/flat/placeholder-empty.svg"
            alt="Placeholder image"
          />
          <img
            class="hidden dark:block"
            src="/img/illustrations/placeholders/flat/placeholder-empty.svg"
            alt="Placeholder image"
          />
        </template>
        <div class="mt-4">
          <BaseButton to="/mail/compose" color="primary" class="!h-12 w-48 items-center gap-2">
            <Icon name="lucide:plus" class="h-5 w-5" />
            Compose new
          </BaseButton>
        </div>
      </BasePlaceholderPage>
    </div>
  </div>
</template>
