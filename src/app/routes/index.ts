import express, { Router } from 'express';
import { AuthRoute } from '../module/auth/auth.route.js';
import { UserRoute } from '../module/user/user.route.js';


const router: Router = express.Router()


const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRoute
    },
    {
        path: '/user',
        route: UserRoute
    },
    // {
    //     path: '/otp',
    //     route: OtpRoute
    // },
]

moduleRoutes.map(route => router.use(route.path, route.route))

export default router