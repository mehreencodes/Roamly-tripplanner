const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim()

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function uploadImage(file: File): Promise<string> {
  if (!cloudName || !preset) throw new Error('Photo upload is not set up yet.')
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > MAX_SIZE) throw new Error('Image must be smaller than 5 MB.')

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', preset)

  let res: Response
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    })
  } catch {
    throw new Error('Network problem. Check your internet and try again.')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const reason: string = data?.error?.message ?? `HTTP ${res.status}`
    console.error('Cloudinary upload error:', reason)
    throw new Error(`Upload failed: ${reason}`)
  }

  // 256x256 square, chehre par focus, auto format/quality
  return (data.secure_url as string).replace(
    '/upload/',
    '/upload/c_fill,g_face,w_256,h_256,f_auto,q_auto/',
  )
}