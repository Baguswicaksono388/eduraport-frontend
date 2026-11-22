<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
</script>

<template>
  <div class="px-2 py-1 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1 shadow-sm border border-blue-600/50 w-fit">
    <Sparkles :size="10" class="text-amber-300" />
    Solo Edition
  </div>
</template>
