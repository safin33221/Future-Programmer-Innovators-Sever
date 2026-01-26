import "dotenv/config";

import prisma from './lib/prisma.js';
import app from './app.js';
import { connectRedis, redisClient } from "./app/config/redis.config.js";
import seedSuperAdmin from "./app/helper/seed.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
    try {
        await prisma.$connect();
        console.log('🟢 Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('🔴 Failed to start server', error);
        process.exit(1);
    }
}
(async () => {
    connectRedis()
    bootstrap();
    seedSuperAdmin()
})()

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
