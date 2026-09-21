/** 触发浏览器下载 */
export const download = (blob: Blob, fileName: string): void => {
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }, 200)
}
