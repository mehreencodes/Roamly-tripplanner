import { useState } from 'react'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
}

export default function SmartImage({ src, alt, className = '' }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const showFallback = !src || failed

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-forest-dark">
          <span className="font-display text-lg text-cream/70">{alt}</span>
        </div>
      ) : (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-sand" />}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      )}
    </div>
  )
}