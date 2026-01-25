import express, { Router } from 'express';
import { AuthRoute } from '../module/auth/auth.route.js';
import { UserRoute } from '../module/user/user.route.js';
import { NoticeRoute } from '../module/notice/notice.route.js';
import { MemberRoute } from '../module/member/member.route.js';
import { OtpRoute } from '../module/otp/otp.route.js';
import { DepartmentRoute } from '../module/department/department.route.js';
import { SessionRoute } from '../module/session/session.route.js';



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
    {
        path: '/notices',
        route: NoticeRoute
    },
    {
        path: '/member',
        route: MemberRoute
    },
    {
        path: '/otp',
        route: OtpRoute
    },
    {
        path: '/department',
        route: DepartmentRoute
    },
    {
        path: '/sessions',
        route: SessionRoute
    },
]

moduleRoutes.map(route => router.use(route.path, route.route))

export default router