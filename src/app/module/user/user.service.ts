import { userSearchableFields } from "./user.constant.js";
import prisma from "../../../lib/prisma.js";
import { Prisma, UserRole } from "@prisma/client";
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
        where: {
            email,
            isDelete: false
        },
        include: {
            admin: true,
            mentor: true,
            moderator: true,
            member: {
                include: {
                    department: true,
                    session: true,
                    learningTrack: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                }
            }
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    let roleSpecificData = null;

    switch (user.role) {
        case "ADMIN":
            roleSpecificData = {
                adminLevel: user.admin?.adminLevel,
                permissions: user.admin?.permissions || []
            };
            break;
        case "MEMBER":
            roleSpecificData = {
                studentId: user.member?.studentId,
                department: user.member?.department,
                session: user.member?.session,
                learningTrack: user.member?.learningTrack,
                batch: user.member?.batch,
                skills: user.member?.skills || [],
                github: user.member?.github,
                linkedin: user.member?.linkedin
            };
            break;
        case "MENTOR":
            roleSpecificData = {
                expertise: user.mentor?.expertise,
                designation: user.mentor?.designation,
                company: user.mentor?.company,
                experience: user.mentor?.experience,
                github: user.mentor?.github,
                linkedin: user.mentor?.linkedin
            };
            break;
        case "MODERATOR":
            roleSpecificData = {
                permissions: user.moderator?.permissions || [],
                moderationLevel: user.moderator?.moderationLevel
            };
            break;
    }

    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: roleSpecificData
    };
};

const SoftDelete = async (id: string) => {
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
