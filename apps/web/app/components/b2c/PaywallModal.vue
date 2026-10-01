<script setup lang="ts">
import { Lock, Crown, ArrowRight } from 'lucide-vue-next'
import { BaseButton, BaseModal } from '@eduraport/ui'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Akses Terkunci'
  },
  message: {
    type: String,
    default: 'Fitur ini membutuhkan langganan aktif. Silakan upgrade paket Anda untuk melanjutkan.'
  },
  requiredPlan: {
    type: String,
    default: 'PRO'
  }
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const closeModal = () => {
  emit('update:modelValue', false)
}

const goToUpgrade = () => {
  closeModal()
  router.push('/b2c/subscription')
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="md">
    <div class="p-8 text-center relative overflow-hidden">
      <!-- Decor -->
      <div class="absolute -right-12 -top-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
      <div class="absolute -left-12 -bottom-12 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl"></div>
      
      <div class="relative z-10">
        <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200 dark:border-amber-800/50">
          <Lock :size="32" />
        </div>
        
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-3">{{ title }}</h3>
        <p class="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {{ message }}
        </p>

        <div class="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-8 border border-slate-100 dark:border-zinc-800 flex items-center justify-center gap-2">
          <span class="text-sm text-slate-500">Membuntuhkan paket:</span>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <Crown :size="12" /> {{ requiredPlan }}
          </span>
        </div>

        <div class="flex gap-3">
          <BaseButton variant="outline" class="flex-1 justify-center" @click="closeModal">Nanti Saja</BaseButton>
          <BaseButton variant="primary" class="flex-1 justify-center" @click="goToUpgrade">
            Upgrade Sekarang
            <ArrowRight class="ml-1" :size="16"/>
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
