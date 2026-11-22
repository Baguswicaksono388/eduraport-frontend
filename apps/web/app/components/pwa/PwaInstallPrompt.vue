<script setup lang="ts">
import { Download, X, Smartphone, Share2, MoreVertical, PlusSquare, Sparkles, Check, ChevronRight } from 'lucide-vue-next'
import { BaseButton } from '@eduraport/ui'
import { usePwaInstall } from '../../composables/usePwaInstall'

const {
  isInstalled,
  showPrompt,
  isIos,
  isMobile,
  showInstructions,
  initPwa,
  installApp,
  dismissPrompt
} = usePwaInstall()

onMounted(() => {
  initPwa()
})
</script>

<template>
  <ClientOnly>
    <!-- 1. POPUP BANNER (Floating Card Above Mobile BottomNav) -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="translate-y-8 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-8 opacity-0 scale-95"
    >
      <div
        v-if="showPrompt && !isInstalled && !showInstructions"
        class="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-50 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-label="Unduh Aplikasi EduRaport"
      >
        <!-- Header: App Icon, Title, and Close Button -->
        <div class="flex items-start justify-between gap-2.5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-center font-black text-base shadow-md shrink-0 border border-blue-400/30">
              <img
                src="/pwa-192x192.png"
                alt="EduRaport"
                class="w-full h-full object-cover rounded-xl"
                @error="($event.target as HTMLElement).style.display = 'none'"
              />
              <span class="sr-only">EduRaport Logo</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="text-sm font-black text-slate-900 dark:text-zinc-100 leading-tight">
                  Pasang EduRaport PWA
                </h4>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                  Mobile
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                Akses instan dari layar HP tanpa buka browser, lebih cepat & hemat kuota.
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="dismissPrompt"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            aria-label="Tutup prompt"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Value Proposition Chips -->
        <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Sparkles :size="10" />
            <span>Tanpa Unduh AppStore</span>
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            <span>⚡ Cepat & Ringan</span>
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <span>📱 Layar Penuh</span>
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            @click="dismissPrompt"
            class="flex-1 py-2 px-3 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition text-center cursor-pointer min-h-[40px]"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            @click="installApp"
            class="flex-2 py-2.5 px-4 text-xs font-black text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] select-none"
          >
            <Download :size="14" />
            <span>Pasang Sekarang</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 2. STEP-BY-STEP INSTRUCTION MODAL (For iOS Safari or Chrome Fallback) -->
    <div
      v-if="showInstructions"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-in slide-in-from-bottom duration-200"
      >
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 flex items-center justify-center">
              <Smartphone :size="18" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-zinc-100 leading-tight">
                Cara Pasang di HP
              </h4>
              <p class="text-[11px] text-slate-400">
                {{ isIos ? 'Panduan Safari iOS (iPhone)' : 'Panduan Browser Chrome / Android' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="dismissPrompt"
            class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- iOS Instructions -->
        <div v-if="isIos" class="space-y-3 text-xs text-slate-700 dark:text-zinc-300">
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Ketuk Tombol Bagikan (Share)</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                Pilih ikon <Share2 :size="12" class="inline text-blue-600 dark:text-blue-400" /> di bilah navigasi bawah Safari.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Tambah ke Layar Utama</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                Gulir ke bawah dan ketuk <span class="font-bold text-slate-800 dark:text-zinc-200">"Add to Home Screen"</span> <PlusSquare :size="12" class="inline" />.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Ketuk "Tambah" (Add)</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Ketuk di pojok kanan atas. Ikon EduRaport akan langsung muncul di beranda HP Anda!
              </p>
            </div>
          </div>
        </div>

        <!-- Android / Other Instructions -->
        <div v-else class="space-y-3 text-xs text-slate-700 dark:text-zinc-300">
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Ketuk Menu Titik Tiga</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                Ketuk ikon <MoreVertical :size="12" class="inline text-slate-700 dark:text-zinc-300" /> di pojok kanan atas browser Chrome.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Pilih "Instal Aplikasi"</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Pilih opsi <span class="font-bold text-slate-800 dark:text-zinc-200">"Instal Aplikasi"</span> atau <span class="font-bold text-slate-800 dark:text-zinc-200">"Tambahkan ke Layar Utama"</span>.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <div>
              <p class="font-semibold text-slate-900 dark:text-zinc-100">Selesai!</p>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Aplikasi EduRaport terpasang dan dapat dibuka kapan saja layaknya aplikasi native.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="dismissPrompt"
          class="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-md transition cursor-pointer text-center"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  </ClientOnly>
</template>
