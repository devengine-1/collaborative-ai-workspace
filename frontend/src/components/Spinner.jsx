import { motion } from 'framer-motion'

export default function Spinner({ className = 'h-4 w-4' }) {
  return (
    <motion.span
      className={`inline-block rounded-full border-2 border-current border-t-transparent ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  )
}
