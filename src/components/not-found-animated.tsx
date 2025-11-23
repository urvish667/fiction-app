"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass, Home, Search, Feather, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function NotFoundAnimated() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        x: mousePosition.x * 0.02,
                        y: mousePosition.y * 0.02,
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: mousePosition.x * -0.02,
                        y: mousePosition.y * -0.02,
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
                />
            </div>

            <div className="container px-4 mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative inline-block mb-8"
                >
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 2, -2, 0],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="text-[150px] md:text-[220px] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary/20 to-primary/5 select-none"
                    >
                        404
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Compass className="w-24 h-24 md:w-32 md:h-32 text-primary" strokeWidth={1.5} />
                            </motion.div>
                            <motion.div
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0.8, 1.2, 0.8],
                                    x: [0, 10, 0],
                                    y: [0, -10, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -top-4 -right-4"
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400" />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="space-y-6 max-w-2xl mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Lost in the Story?
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        It seems you've wandered into an unwritten chapter.
                        The page you're looking for might have been moved, deleted, or never existed in this realm.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <Button asChild size="lg" className="group min-w-[160px]">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                Return Home
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="group min-w-[160px]">
                            <Link href="/browse">
                                <Search className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                Browse Stories
                            </Link>
                        </Button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="pt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                        <Feather className="w-4 h-4" />
                        <span>Every end is just a new beginning</span>
                        <Feather className="w-4 h-4 transform scale-x-[-1]" />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
