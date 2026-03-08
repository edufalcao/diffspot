import { ref } from 'vue'

export interface ShareData {
  id: string
  leftText: string
  rightText: string
  language: string
  createdAt: string
}

export function useShare() {
  const isSharing = ref(false)

  /**
   * Save a diff share via the API. Returns the share URL on success.
   */
  async function saveShare(
    leftText: string,
    rightText: string,
    language: string = 'plaintext',
  ): Promise<string> {
    isSharing.value = true

    try {
      const response = await $fetch<{ id: string; url: string }>('/api/share', {
        method: 'POST',
        body: { leftText, rightText, language },
      })

      return response.url
    } finally {
      isSharing.value = false
    }
  }

  /**
   * Load a shared diff by its ID. Returns the share data.
   */
  async function loadShare(id: string): Promise<ShareData> {
    const response = await $fetch<ShareData>(`/api/share/${id}`)
    return response
  }

  /**
   * Copy a share link to the clipboard. Returns true on success, false on failure.
   */
  async function copyShareLink(url: string): Promise<boolean> {
    try {
      // Build the full URL if a relative path was given
      const fullUrl = url.startsWith('http')
        ? url
        : `${window.location.origin}${url}`

      await navigator.clipboard.writeText(fullUrl)
      return true
    } catch {
      return false
    }
  }

  return {
    isSharing,
    saveShare,
    loadShare,
    copyShareLink,
  }
}
