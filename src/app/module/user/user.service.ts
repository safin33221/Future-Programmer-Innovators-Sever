import bcrypt from "bcrypt";
import envConfig from "../../config/env.config.js";
import { userSearchableFields } from "./user.constant.js";
import prisma from "../../../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";






const getAllUsers = async (params: any, options: IOptions) => {

    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)
    const { searchTerm, ...filterData } = params;
    console.log(filterData);

    const andConditions: Prisma.UserWhereInput[] = [];
    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }))
        })
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }

    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? {
        AND: andConditions
    } : {}




    const users = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            isActive: true,
            isVerified: true


        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });


    const total = await prisma.user.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: users,
    };
};

const getMe = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            admin: true,
            mentor: true,
            moderator: true,
            member: true

        },
    })

    if (!user) {
        throw new Error("User not found");
    }

    let profile = null

    switch (user.role) {

        case "ADMIN": {
            profile = user.admin
        }
        case "MEMBER": {
            profile = user.member
        }
        case "MODERATOR": {
            profile = user.moderator
        }

    }



    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

};

export const SoftDelete = async (id: string) => {
    return await prisma.user.update({
        where: { id },
        data: {
            isDelete: true,
            isActive: false,
            deletedAt: new Date(),
        },
    });
};




export const UserService = {

    getAllUsers,
    getMe,
    SoftDelete
};
