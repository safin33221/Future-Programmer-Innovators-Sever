import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    Salt_rounds: process.env.SALT_ROUNDS,
    JWT: {
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
        JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as string | number,
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as string | number,
    },
    REDIS: {
        REDIS_HOST: process.env.REDIS_HOST as string,
        REDIS_PORT: process.env.REDIS_PORT as string,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
        REDIS_USERNAME: process.env.REDIS_USERNAME as string
    },
    SMTP: {
        SMTP_USER: process.env.SMTP_USER as string,
        SMTP_PASS: process.env.SMTP_PASS as string,
        SMTP_HOST: process.env.SMTP_HOST as string,
        SMTP_PORT: process.env.SMTP_PORT as string,
        SMTP_FROM_NAME: process.env.SMTP_FROM_NAME as string,
        SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL as string
    }


}