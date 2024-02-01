<script setup lang="ts">
import type { Envelope, ReceivedEnvelope, TransactionHash } from '@4thtech-sdk/types';
import { toTypedSchema } from '@vee-validate/zod';
import { Field, useForm } from 'vee-validate';
import { z } from 'zod';
import { isAddress } from 'viem';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  modelValue: TransactionHash | undefined;
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', value: TransactionHash): void;
}>();

const { encryptorClient, isReadyToUse: isEncryptorReadyToUse } = useEncryptor();
const { isNftIntegrationEnabled, primaryNft } = usePollinationX();
const { mailClient } = useMail();
const route = useRoute();
const toast = useToast();

const selectedEnvelope = useState<ReceivedEnvelope | undefined>('selected-envelope');
const replyContent = useState<string>('reply-content');

const initialValues = ref({ mail: {} });
const attachments = ref<{ name: string; content: File }[]>([]);
const attachmentsUploadProgress = ref<Record<string, number>>({});
const transactionHash = useVModel(props, 'modelValue', emits);
const canUseEncryption = ref(true);

// This is the Zod schema for the form input
// It's used to define the shape that the form data will have
const zodSchema = z.object({
  mail: z.object({
    receiver: z
      .string()
      .min(1, { message: 'Please enter an address' })
      .refine(isAddress, { message: 'Invalid receiver address' })
      .refine((address) => (canUseEncryption.value ? encryptorClient.isUserAddressInitialized(address) : true), {
        message:
          'Unfortunately, the recipient is not registered with Encryptor, and as a result, encrypted content cannot be sent to them. Please ensure the recipient is registered with Encryptor to enable encrypted communication.',
      }),
    subject: z.string().min(1, { message: "Subject can't be empty" }),
    content: z.string().optional(),
  }),
});

const { handleSubmit, isSubmitting, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(zodSchema),
  initialValues,
});

const resetToInitialState = () => {
  resetForm();
  attachments.value = [];
  attachmentsUploadProgress.value = {};
};

const onSubmit = handleSubmit(
  async (values) => {
    const envelope: Envelope = {
      content: {
        subject: values.mail.subject,
        body: values.mail.content,
        attachments: attachments.value,
      },
      receiver: values.mail.receiver,
    };

    let encryption;
    if (canUseEncryption.value) {
      const { encryptorAesEncryption } = useEncryption();
      await encryptorAesEncryption.initialize(values.mail.receiver);
      encryption = encryptorAesEncryption;
    }

    try {
      transactionHash.value = await mailClient.send({
        envelope,
        encryption,
        onStateChange: (state) => console.log(state),
        onUploadProgress: (progressInfo) => {
          const { fileName, percent } = progressInfo;
          if (fileName) {
            attachmentsUploadProgress.value[fileName] = percent;
          }
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      return;
    }

    resetToInitialState();
  },
  () => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  },
);

const prepareContent = (action: 'reply' | 'forward', envelope: ReceivedEnvelope) => {
  const prefix = action === 'reply' ? 'Re: ' : 'Fwd: ';

  return {
    mail: {
      subject: `${prefix}${envelope.content.subject}`,
      receiver: action === 'reply' ? envelope.sender : '',
      content: `${replyContent.value || ''}\n\nOn ${useFormattedDate(envelope.sentAt)} ${envelope.sender} wrote:\n\n${
        envelope.content.body
      }`,
    },
  };
};

const isEncryptorWidgetVisible = computed(() => canUseEncryption.value && !isEncryptorReadyToUse.value);
const isPollinationXWidgetVisible = computed(() => isNftIntegrationEnabled && !primaryNft.value);

onMounted(() => {
  const queryType = route.query.reply ? 'reply' : route.query.forward ? 'forward' : undefined;

  if (selectedEnvelope.value && queryType) {
    initialValues.value = prepareContent(queryType, selectedEnvelope.value);
  }
});

// Ask the user for confirmation before leaving the page if the form has unsaved changes
onBeforeRouteLeave(() => {
  if (meta.value.dirty) {
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  }
});
</script>

<template>
  <form action="" method="POST" @submit.prevent="onSubmit">
    <BaseCard>
      <div class="flex items-center gap-4 px-10 pb-5 pt-10">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-500/20 font-sans text-2xl text-primary-500"
        >
          <Icon name="ph:envelope-simple-duotone" class="h-5 w-5" />
        </div>
        <div class="block text-xl font-semibold text-gray-700">
          <BaseHeading as="h3" size="lg" weight="medium" class="text-muted-800 dark:text-muted-100">
            New Mail
          </BaseHeading>
          <BaseText size="sm" class="text-muted-400">Compose a new mail.</BaseText>
        </div>
        <div class="ms-auto">
          <Field v-slot="{ handleChange, handleBlur }" name="notifications.enabled">
            <BaseSwitchBall
              v-model="canUseEncryption"
              :disabled="isSubmitting"
              label="Use Encryption"
              sublabel="For encrypted communication"
              color="primary"
              @update:model-value="handleChange"
              @blur="handleBlur"
            />
          </Field>
        </div>
      </div>
      <!-- Encryptor widget -->
      <EncryptorWidget v-if="isEncryptorWidgetVisible" color="none" />
      <!-- PollinationX widget -->
      <PollinationxWidget v-if="isPollinationXWidgetVisible" color="none" />
      <!-- Form -->
      <div v-show="!isEncryptorWidgetVisible && !isPollinationXWidgetVisible">
        <div class="px-10 py-5">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
              <Field v-slot="{ field, errorMessage, handleChange, handleBlur }" name="mail.receiver">
                <BaseInput
                  label="Receiver"
                  placeholder="Enter recipient's address"
                  icon="lucide:user"
                  :model-value="field.value"
                  :error="errorMessage"
                  :disabled="isSubmitting"
                  type="text"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </Field>
            </div>
            <div class="col-span-12">
              <Field v-slot="{ field, errorMessage, handleChange, handleBlur }" name="mail.subject">
                <BaseInput
                  label="Subject"
                  placeholder="Email subject (e.g., Meeting Schedule, Inquiry, etc.)"
                  icon="lucide:edit-2"
                  :model-value="field.value"
                  :error="errorMessage"
                  :disabled="isSubmitting"
                  type="text"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </Field>
            </div>
            <div class="col-span-12">
              <Field v-slot="{ field, errorMessage, handleChange, handleBlur }" name="mail.content">
                <BaseTextarea
                  label="Content"
                  placeholder="Body of the email (Your message goes here)"
                  :model-value="field.value"
                  :error="errorMessage"
                  :disabled="isSubmitting"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </Field>
            </div>
          </div>
        </div>
        <!-- Attachments -->
        <div class="border-t border-muted-200 bg-muted-50 p-10 dark:border-muted-700 dark:bg-muted-800/70">
          <div class="flex items-center justify-between">
            <div>
              <BaseHeading as="h3" size="md" weight="medium">Attachments</BaseHeading>
              <BaseText size="xs" class="text-muted-400">Add some mail attachments</BaseText>
            </div>
          </div>
          <div class="mt-10 grid grid-cols-12 gap-4">
            <div class="col-span-12 grid grid-cols-12">
              <div class="col-span-12 flex flex-col justify-start pt-4 sm:col-span-3">
                <label class="nui-label text-[0.825rem]">Attachments</label>
              </div>
              <div class="col-span-12 sm:col-span-9">
                <AttachmentsUploader
                  v-model="attachments"
                  :disabled="isSubmitting"
                  :upload-progress="attachmentsUploadProgress"
                />
              </div>
            </div>
          </div>
          <div class="col-span-12 mt-10">
            <div class="flex items-center gap-2 rounded-lg bg-muted-100 p-4 dark:bg-muted-700/70">
              <BaseIconBox
                size="sm"
                shape="rounded"
                :class="
                  canUseEncryption
                    ? 'bg-success-200 text-success-500 dark:bg-success-800'
                    : 'bg-pink-500/20 text-pink-500'
                "
              >
                <Icon :name="canUseEncryption ? 'ph:smiley-duotone' : 'ph:smiley-sad-duotone'" class="h-6 w-6" />
              </BaseIconBox>
              <BaseText
                size="sm"
                :class="canUseEncryption ? 'text-success-500 dark:text-success-400' : 'text-pink-500'"
              >
                {{
                  canUseEncryption
                    ? 'Encryption is enabled for enhanced security.'
                    : 'Encryption is disabled. Messages will be sent in plain text.'
                }}
              </BaseText>
            </div>
          </div>
        </div>
        <div class="flex border-t border-muted-200 bg-muted-50 px-10 py-5 dark:border-muted-700 dark:bg-muted-800/70">
          <div class="ms-auto flex items-center gap-2">
            <BaseButtonAction :disabled="isSubmitting" class="!h-12 px-5" @click.prevent="resetToInitialState()">
              <Icon name="ph:arrows-clockwise" class="h-5 w-5" />
              <span>Reset</span>
            </BaseButtonAction>
            <BaseButtonAction
              :disabled="isSubmitting"
              :loading="isSubmitting"
              type="submit"
              color="primary"
              class="!h-12 px-5"
            >
              <Icon name="ph:paper-plane-tilt" class="h-5 w-5" />
              <span>Send</span>
            </BaseButtonAction>
          </div>
        </div>
      </div>
    </BaseCard>
  </form>
</template>
