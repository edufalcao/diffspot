import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'

export const VIRTUAL_SCROLL_ITEM_HEIGHT = 26

export function useVirtualScroll(
  containerRef: Ref<HTMLElement | null>,
  totalItems: Ref<number> | ComputedRef<number>,
  options?: { itemHeight?: number; overscan?: number },
) {
  const scrollTop = ref(0)
  const containerHeight = ref(0)
  const isPrinting = ref(false)

  const itemHeight = options?.itemHeight ?? VIRTUAL_SCROLL_ITEM_HEIGHT
  const overscan = options?.overscan ?? 20

  const totalHeight = computed(() => totalItems.value * itemHeight)

  const startIndex = computed(() => {
    if (isPrinting.value) return 0
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
  })

  const endIndex = computed(() => {
    if (isPrinting.value) return totalItems.value
    const visibleCount = Math.ceil(containerHeight.value / itemHeight)
    return Math.min(totalItems.value, Math.floor(scrollTop.value / itemHeight) + visibleCount + overscan)
  })

  const offsetY = computed(() => startIndex.value * itemHeight)

  function onScroll() {
    const el = containerRef.value
    if (!el) return
    scrollTop.value = el.scrollTop
  }

  function onBeforePrint() { isPrinting.value = true }
  function onAfterPrint() { isPrinting.value = false }

  let resizeObserver: ResizeObserver | null = null
  let attachedEl: HTMLElement | null = null

  function attach(el: HTMLElement | null) {
    if (attachedEl) {
      attachedEl.removeEventListener('scroll', onScroll)
    }
    resizeObserver?.disconnect()
    attachedEl = null

    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true })
      containerHeight.value = el.clientHeight
      scrollTop.value = el.scrollTop
      resizeObserver = new ResizeObserver(() => {
        containerHeight.value = el.clientHeight
      })
      resizeObserver.observe(el)
      attachedEl = el
    }
  }

  watch(containerRef, (el) => attach(el), { flush: 'post' })

  onMounted(() => {
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    if (containerRef.value) attach(containerRef.value)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeprint', onBeforePrint)
    window.removeEventListener('afterprint', onAfterPrint)
    attach(null)
  })

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    isPrinting,
  }
}
