"use client"

import { motion } from "framer-motion"
import { BookOpen, Sparkles, Users, Tag, Award, MessageSquare, Compass, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-6">Welcome to FableSpace – Where Stories Come Alive</h1>
          <p className="text-xl text-muted-foreground">
            A cozy corner of the internet for storytellers, dreamers, and readers alike.
          </p>
        </motion.div>
        
        {/* Our Mission */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-6">Our Mission</h2>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-lg">
              FableSpace is a platform built for passionate writers and curious readers. 
              Our mission is to empower creativity, celebrate original storytelling, 
              and connect people through the written word—one story at a time.
            </p>
          </div>
        </motion.section>
        
        {/* What You Can Do */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">What You Can Do on FableSpace</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Write</h3>
                <p className="text-muted-foreground">Publish your own stories with our easy-to-use editor</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Read</h3>
                <p className="text-muted-foreground">Discover thousands of original works from talented writers</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tag</h3>
                <p className="text-muted-foreground">Organize your stories by genre and theme for better discovery</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Join Challenges</h3>
                <p className="text-muted-foreground">Test your creativity with writing challenges and prompts</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Comment & Interact</h3>
                <p className="text-muted-foreground">Engage with fellow writers and readers through comments</p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Get Recommendations</h3>
                <p className="text-muted-foreground">Discover stories tailored to your reading preferences</p>
              </div>
            </div>
          </div>
        </motion.section>
        
        {/* Why FableSpace */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Why FableSpace?</h2>
          
          <div className="bg-muted/30 rounded-lg p-8">
            <ul className="space-y-4">
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Reader-focused, minimal distraction interface</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Built for both short and longform fiction</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Genre-flexible: from fantasy to slice-of-life</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Ongoing features like writing challenges and stats</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
                <span>Community-first, creativity-driven</span>
              </li>
            </ul>
          </div>
        </motion.section>
        
        {/* Our Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-6">Our Story</h2>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-lg mb-4">
              FableSpace began with a simple idea: give storytellers a home. Tired of algorithm-heavy platforms, 
              we dreamed of a quiet digital library where imagination thrives and stories aren't buried in noise. 
              That dream became FableSpace.
            </p>
          </div>
        </motion.section>
        
        {/* Community & Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Community & Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Creative Freedom</h3>
              <p className="text-muted-foreground">We believe in giving writers the space to express themselves</p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Diversity & Inclusivity</h3>
              <p className="text-muted-foreground">We support diverse voices and perspectives in storytelling</p>
            </div>
          </div>
        </motion.section>
        
        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to write your first story?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/write/story-info">Start Writing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/browse">Explore Stories</Link>
            </Button>
          </div>
        </motion.section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
