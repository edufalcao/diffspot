import { ref } from 'vue'

interface ExportResult {
  success: boolean
  error?: string
}

export function useExport() {
  const isExporting = ref(false)

  async function exportAsPng(
    element: HTMLElement,
    filename = 'diffspot-export.png',
  ): Promise<ExportResult> {
    if (isExporting.value) {
      return { success: false, error: 'An export is already in progress.' }
    }

    isExporting.value = true

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element)

      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()

      return { success: true }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export as PNG.'
      return { success: false, error: message }
    }
    finally {
      isExporting.value = false
    }
  }

  async function exportAsPdf(
    element: HTMLElement,
    filename = 'diffspot-export.pdf',
  ): Promise<ExportResult> {
    if (isExporting.value) {
      return { success: false, error: 'An export is already in progress.' }
    }

    isExporting.value = true

    try {
      const { toPng } = await import('html-to-image')
      const { default: jsPDF } = await import('jspdf')

      const dataUrl = await toPng(element)

      // Load the image to read its natural dimensions
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load captured image.'))
        img.src = dataUrl
      })

      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight

      // Use landscape orientation for wide diffs
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [imgWidth, imgHeight],
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Scale the image to fit the page width while maintaining aspect ratio
      const scale = pageWidth / imgWidth
      const scaledWidth = pageWidth
      const scaledHeight = imgHeight * scale

      // If the scaled image is taller than the page, fit to page height instead
      if (scaledHeight > pageHeight) {
        const fitScale = pageHeight / scaledHeight
        const finalWidth = scaledWidth * fitScale
        const finalHeight = pageHeight
        const xOffset = (pageWidth - finalWidth) / 2

        pdf.addImage(dataUrl, 'PNG', xOffset, 0, finalWidth, finalHeight)
      }
      else {
        pdf.addImage(dataUrl, 'PNG', 0, 0, scaledWidth, scaledHeight)
      }

      pdf.save(filename)

      return { success: true }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export as PDF.'
      return { success: false, error: message }
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    exportAsPng,
    exportAsPdf,
  }
}
