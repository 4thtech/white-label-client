<script setup lang="ts">
const { isOpen, isMobileOpen, toggle } = useCollapse();
const { lg } = useTailwindBreakpoints();
</script>

<template>
  <button type="button" class="flex h-10 w-10 items-center justify-center" @click="() => toggle()">
    <div class="relative h-5 w-5" :class="[isOpen && lg ? 'scale-90' : '', isMobileOpen && !lg ? 'scale-90' : '']">
      <span
        class="absolute block h-0.5 w-full bg-primary-500 transition-all duration-300"
        :class="[
          isOpen && lg ? 'top-1 max-w-[75%] -rotate-45 rtl:rotate-45' : 'top-0.5',
          isMobileOpen && !lg ? 'top-1 max-w-[75%] -rotate-45 rtl:rotate-45' : 'top-0.5',
        ]"
      ></span>
      <span
        class="absolute top-1/2 block h-0.5 w-full max-w-[50%] bg-primary-500 transition-all duration-300"
        :class="[
          isOpen && lg ? 'translate-x-4 opacity-0 rtl:-translate-x-4' : '',
          isMobileOpen && !lg ? 'translate-x-4 opacity-0  rtl:-translate-x-4' : '',
        ]"
      ></span>
      <span
        class="absolute block h-0.5 w-full bg-primary-500 transition-all duration-300"
        :class="[
          isOpen && lg ? 'bottom-1 max-w-[75%] rotate-45 rtl:-rotate-45' : 'bottom-0',
          isMobileOpen && !lg ? 'bottom-1 max-w-[75%] rotate-45 rtl:-rotate-45' : 'bottom-0',
        ]"
      ></span>
    </div>
  </button>
</template>
