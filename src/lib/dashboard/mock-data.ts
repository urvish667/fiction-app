import { sampleStories } from "@/lib/sample-data"

// Mock data for dashboard
export const dashboardData = {
  totalReads: 45678,
  totalLikes: 8943,
  totalComments: 2156,
  totalFollowers: 1243,
  totalEarnings: 1289.65,
  readsChange: 12.4,
  likesChange: 8.7,
  commentsChange: -3.2,
  followersChange: 5.6,
  earningsChange: 15.3,
  stories: sampleStories.slice(0, 5).map((story) => ({
    ...story,
    earnings: Math.floor(Math.random() * 300) + 50,
  })),
}

// Mock data for charts
export const readsData = [
  { name: "Jan", reads: 4000 },
  { name: "Feb", reads: 3000 },
  { name: "Mar", reads: 5000 },
  { name: "Apr", reads: 4500 },
  { name: "May", reads: 6000 },
  { name: "Jun", reads: 5500 },
  { name: "Jul", reads: 7000 },
]

export const engagementData = [
  { name: "Jan", likes: 2400, comments: 400 },
  { name: "Feb", likes: 1800, comments: 300 },
  { name: "Mar", likes: 3000, comments: 500 },
  { name: "Apr", likes: 2700, comments: 450 },
  { name: "May", likes: 3600, comments: 600 },
  { name: "Jun", likes: 3300, comments: 550 },
  { name: "Jul", likes: 4200, comments: 700 },
]

export const earningsData = [
  { name: "Jan", earnings: 250 },
  { name: "Feb", earnings: 180 },
  { name: "Mar", earnings: 300 },
  { name: "Apr", earnings: 270 },
  { name: "May", earnings: 360 },
  { name: "Jun", earnings: 330 },
  { name: "Jul", earnings: 420 },
]

export const demographicsData = [
  { age: "13-17", male: 200, female: 300, other: 50 },
  { age: "18-24", male: 800, female: 1200, other: 200 },
  { age: "25-34", male: 1200, female: 1500, other: 300 },
  { age: "35-44", male: 700, female: 900, other: 150 },
  { age: "45-54", male: 400, female: 500, other: 100 },
  { age: "55+", male: 200, female: 300, other: 50 },
]

export const geographicData = [
  { country: "United States", readers: 15420, percentage: 33.8 },
  { country: "United Kingdom", readers: 6540, percentage: 14.3 },
  { country: "Canada", readers: 4320, percentage: 9.5 },
  { country: "Australia", readers: 3650, percentage: 8.0 },
  { country: "Germany", readers: 2840, percentage: 6.2 },
  { country: "France", readers: 2150, percentage: 4.7 },
  { country: "India", readers: 1980, percentage: 4.3 },
  { country: "Other", readers: 8778, percentage: 19.2 },
]
