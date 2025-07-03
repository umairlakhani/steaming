const { PrismaClient } = require('@prisma/client')

// Create a single PrismaClient instance
const prisma = new PrismaClient({
    log: ['error'], // Enable query and error logging
})

// Handle potential errors
prisma.$on('error', (e) => {
    console.error('Prisma Client error:', e)
})

// Handle process termination
process.on('beforeExit', async () => {
    await prisma.$disconnect()
})

module.exports = prisma 