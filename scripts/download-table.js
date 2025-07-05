import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

function convertToCSV(data) {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(field => JSON.stringify(row[field] ?? '')).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

async function main() {
  const donations = await prisma.donation.findMany()
  const csv = convertToCSV(donations)

  fs.writeFileSync('donations.csv', csv, 'utf8')
  console.log('CSV file has been written: donations.csv')

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})
