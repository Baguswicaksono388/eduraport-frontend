<script setup lang="ts">
import { Calendar, LayoutGrid, BookOpen, Trophy, Library, ArrowRight } from 'lucide-vue-next'
import { BaseCard } from '@eduraport/ui'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const { isSoloTeacher } = useAuth()

const masterModules = computed(() => {
  const modules = [
    {
      title: 'Tahun Ajaran',
      description: 'Kelola data tahun ajaran dan semester aktif untuk seluruh kegiatan akademik.',
      icon: Calendar,
      to: '/academic-year',
      color: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: 'Data Kelas',
      description: 'Manajemen data rombongan belajar (rombel) dan wali kelas.',
      icon: LayoutGrid,
      to: '/class',
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      title: 'Mata Pelajaran',
      description: 'Daftar mata pelajaran yang diajarkan pada unit sekolah.',
      icon: BookOpen,
      to: '/subject',
      color: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10'
    },
    {
      title: 'Manajemen Kurikulum',
      description: 'Pengaturan kurikulum yang berlaku (K13, Merdeka, dll) dan alokasi mapel.',
      icon: Library,
      to: '/kurikulum',
      color: 'text-pink-500 dark:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-500/10'
    }
  ]

  if (!isSoloTeacher.value) {
    modules.push({
      title: 'Ekstrakurikuler',
      description: 'Kelola daftar kegiatan ekstrakurikuler dan pembinanya.',
      icon: Trophy,
      to: '/extracurricular',
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10'
    })
  }

  return modules
})
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Master Akademik</h2>
        <p class="text-slate-500 dark:text-zinc-400 mt-1">
          Pusat pengaturan data master untuk keperluan akademik sekolah.
        </p>
      </div>
    </div>

    <!-- Grid Modules -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink v-for="mod in masterModules" :key="mod.title" :to="mod.to" class="group block h-full">
        <BaseCard class="h-full hover:shadow-md transition-all duration-200 border-slate-200/60 dark:border-zinc-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 dark:bg-zinc-900/50">
          <div class="p-6 flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
              <div :class="['p-3 rounded-xl transition-colors', mod.bg, mod.color]">
                <component :is="mod.icon" :size="24" stroke-width="1.5" />
              </div>
              <ArrowRight :size="20" class="text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            
            <h3 class="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {{ mod.title }}
            </h3>
            
            <p class="text-sm text-slate-500 dark:text-zinc-400 flex-grow">
              {{ mod.description }}
            </p>
          </div>
        </BaseCard>
      </NuxtLink>
    </div>
  </div>
</template>
