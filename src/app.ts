import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import router from "./app/routes/index.js";
import globalErrorHandler from "./app/middleware/globalErrorHandler.js";

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
app.use(morgan("dev"));
app.use(cookieParser());

/* -------------------- ROUTES -------------------- */
app.use("/api/v1", router);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚀",
    });
});

/* -------------------- GLOBAL ERROR -------------------- */
app.use(globalErrorHandler);

/* -------------------- NOT FOUND -------------------- */
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "API not found",
    });
});

export default app;
