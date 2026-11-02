import { motion } from 'framer-motion'
import Hero from './Hero.jsx'
import HowItWorks from './HowItWorks.jsx'
import TonePlayground from './TonePlayground.jsx'
import Features from './Features.jsx'
import Faq from './Faq.jsx'
import FinalCta from './FinalCta.jsx'

export const LANDING_SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'playground', label: 'Playground' },
  { id: 'features', label: 'Features' },
  { id: 'faq', label: 'FAQ' },
]

export default function Landing(props) {
  return (
    <motion.div exit={{ opacity: 0, y: -32, filter: 'blur(8px)', transition: { duration: 0.35 } }}>
      <Hero {...props} />
      <HowItWorks />
      <TonePlayground />
      <Features />
      <Faq />
      <FinalCta />
    </motion.div>
  )
}
