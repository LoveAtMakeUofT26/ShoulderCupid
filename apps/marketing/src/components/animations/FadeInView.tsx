import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: 'up' | 'left' | 'right'
}

export function FadeInView({ children, delay = 0, className = '', direction = 'up' }: FadeInViewProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const directionOffset = {
    up: { y: 40, x: 0 },
    left: { y: 0, x: -40 },
    right: { y: 0, x: 40 },
  }

  const offset = directionOffset[direction]

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
