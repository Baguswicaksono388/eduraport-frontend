import { ref } from 'vue'

export const usePagination = (defaultItemPerPage = 10) => {
  const page = ref(1)
  const itemPerPage = ref(defaultItemPerPage)

  const resetPage = () => {
    page.value = 1
  }

  const setPage = (p: number) => {
    page.value = p
  }

  const setItemPerPage = (n: number) => {
    itemPerPage.value = n
    page.value = 1
  }

  return {
    page,
    itemPerPage,
    resetPage,
    setPage,
    setItemPerPage,
  }
}
