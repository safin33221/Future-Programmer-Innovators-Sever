import { createClient, type RedisClientType } from 'redis';
import envConfig from './env.config.js';


export const redisClient: RedisClientType = createClient({
    username: 'default',
    password: envConfig.REDIS.REDIS_PASSWORD,
    socket: {
        host: envConfig.REDIS.REDIS_HOST,
        port: Number(envConfig.REDIS.REDIS_PORT)
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

// await redisClient.connect();

// await redisClient.set('foo', 'bar');
// const result = await redisClient.get('foo');
// console.log(result)  // >>> bar

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect()
            console.log("Redis server connected");
        }
    } catch (error) {
        console.error("Redis failed, continuing without Redis");
    }

}

export const ensureRedis = async () => {
    if (!redisClient.isOpen) {
        await connectRedis();
    }
    if (!redisClient.isOpen) {
        throw new Error("Redis client is closed");
    }
};

