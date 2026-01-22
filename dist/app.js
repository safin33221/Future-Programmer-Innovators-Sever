import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
const app = express();
/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
/* -------------------- HEALTH CHECK -------------------- */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running 🚀',
    });
});
/* -------------------- NOT FOUND -------------------- */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API not found',
    });
});
export default app;
//# sourceMappingURL=app.js.map