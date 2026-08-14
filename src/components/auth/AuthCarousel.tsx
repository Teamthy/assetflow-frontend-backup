'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const SLIDES = [
  { src: '/auth/office.jpg', alt: 'Office floor' },
  { src: '/auth/warehouse.jpg', alt: 'Warehouse' },
  { src: '/auth/building.jpg', alt: 'Headquarters' },
  { src: '/auth/workshop.jpg', alt: 'Workshop' },
] as const

export function AuthCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      {SLIDES.map((slide, slideIndex) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={slideIndex === 0}
          sizes="100vw"
          className={cn(
            'object-cover transition-opacity duration-1000 ease-in-out',
            slideIndex === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show photo ${slideIndex + 1}`}
            onClick={() => setIndex(slideIndex)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              slideIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70',
            )}
          />
        ))}
      </div>
    </div>
  )
}
