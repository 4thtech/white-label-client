<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    collapse?: boolean;
    horizontalScroll?: boolean;
  }>(),
  {
    collapse: true,
  },
);

const app = useAppConfig();

const route = useRoute();

const showNavBurger = computed(() => {
  return props.collapse && app.layout.collapse?.toolbar?.showNavBurger;
});
</script>

<template>
  <div class="relative z-50 mb-5 flex h-16 items-center gap-2" :class="props.horizontalScroll && 'pe-4 xl:pe-10'">
    <CollapseBurger v-if="showNavBurger" class="-ms-3" />

    <BaseHeading
      v-if="app.layout.collapse?.toolbar?.showTitle"
      as="h1"
      size="2xl"
      weight="light"
      class="hidden text-muted-800 dark:text-white md:block"
    >
      <slot name="title">{{ route.meta.title }}</slot>
    </BaseHeading>

    <div class="ms-auto"></div>
    <CollapseTools />
  </div>
</template>
