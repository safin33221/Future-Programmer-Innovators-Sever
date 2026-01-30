import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './app/routes/index.js';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './app/middleware/globalErrorHandler.js';
const app: Application = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());




app.use('/api/v1', router)

/* -------------------- HEALTH CHECK -------------------- */
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running 🚀',
    });
});


/* -------------------- Global Error Handler  -------------------- */
app.use(globalErrorHandler);



/* -------------------- NOT FOUND -------------------- */
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'API not found',
    });
});

export default app;
