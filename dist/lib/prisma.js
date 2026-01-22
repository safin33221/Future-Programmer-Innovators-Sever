// import "dotenv/config";
// import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from "../../generated/prisma/client";
// // import { PrismaClient } from '../generated/prisma/client'
// const connectionString = `${process.env.DATABASE_URL}`
// const adapter = new PrismaPg({ connectionString })
// const prisma = new PrismaClient({ adapter })
// export { prisma }
//-------------------------------------------------------------------------------------
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
});
export default prisma;
//# sourceMappingURL=prisma.js.map