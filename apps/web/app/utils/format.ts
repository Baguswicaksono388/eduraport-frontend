export const formatNumber = (numStr: any) => {
  if (numStr === null || numStr === undefined || numStr === '') return 'Rp 0'
  return new Number(numStr).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  })
}

export const formatDate = (dateStr: any) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
