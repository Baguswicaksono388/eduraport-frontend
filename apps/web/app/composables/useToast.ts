export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
}

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const add = (message: string, type: Toast['type'] = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = { id, message, type, title }
    toasts.value.push(toast)

    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const success = (message: string, title?: string, duration?: number) => {
    add(message, 'success', title, duration)
  }

  const error = (message: string, title?: string, duration?: number) => {
    add(message, 'error', title, duration)
  }

  const warning = (message: string, title?: string, duration?: number) => {
    add(message, 'warning', title, duration)
  }

  const info = (message: string, title?: string, duration?: number) => {
    add(message, 'info', title, duration)
  }

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    success,
    error,
    warning,
    info,
    remove
  }
}
