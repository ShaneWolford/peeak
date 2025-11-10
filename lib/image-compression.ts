export async function compressImage(file: File, maxSizeMB = 1, maxWidthOrHeight = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const isPNG = file.type === "image/png"

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        if (isPNG) {
          ctx.clearRect(0, 0, width, height)
        }

        ctx.drawImage(img, 0, 0, width, height)

        const format = isPNG ? "image/png" : "image/jpeg"
        let quality = isPNG ? 0.95 : 0.9
        const targetSize = maxSizeMB * 1024 * 1024

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"))
                return
              }

              // If still too large and quality can be reduced, try again
              if (blob.size > targetSize && quality > 0.5) {
                quality -= 0.1
                tryCompress()
              } else {
                resolve(blob)
              }
            },
            format,
            quality,
          )
        }

        tryCompress()
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}
