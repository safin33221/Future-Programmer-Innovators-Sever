import express from 'express';
import { userController } from './user.controller.js';

import { UserRole } from '@prisma/client';
import { auth } from '../../middleware/auth.js';
import { fileUploader } from '../../helper/fileUploader.js';


const router = express.Router()

router.post("/create-role-base-user",
    auth(UserRole.ADMIN),
    userController.createRoleBaseUser
)
router.get('/',
    auth(UserRole.ADMIN),
    userController.getAllUsers)


router.get("/me",
    auth(),
    userController.getMe);



router.patch('/update',
    fileUploader.upload.single('file'),
    userController.updateUser)



router.patch('/soft-delete/:id',
    auth(UserRole.ADMIN),
    userController.SoftDelete)

export const UserRoute: any = router;
