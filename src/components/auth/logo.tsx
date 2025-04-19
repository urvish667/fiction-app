"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function AuthLogo() {
  return (
    <Link href="/" className="flex justify-center mb-6">
      <motion.div
        className="flex items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-3xl font-bold font-serif text-primary"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          FableSpace
        </motion.h1>
      </motion.div>
    </Link>
  )
}
