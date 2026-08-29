/** 触发浏览器下载 */
export const download = (blob: Blob, fileName: string): void => {
  const nav = navigator as Navigator & {
    msSaveOrOpenBlob?: (b: Blob, n: string) => boolean
    msSaveBlob?: (b: Blob, n: string) => boolean
  }
  if (nav.msSaveOrOpenBlob) {
    nav.msSaveBlob?.(blob, fileName)
    return
  }
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = window.URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
  }, 200)
}
