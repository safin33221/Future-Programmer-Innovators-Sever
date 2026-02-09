import { userSearchableFields } from "./user.constant.js";
import prisma from "../../../lib/prisma.js";
import { Prisma, UserRole } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";
import type { Request } from "express";
import { fileUploader } from "../../helper/fileUploader.js";

/* =====================================================
   GET ALL USERS
===================================================== */
export const getAllUsers = async (params: any, options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    /* ---------- search ---------- */
    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    /* ---------- safe filters ---------- */
    const allowedFilters = ["role", "isActive", "isVerified", "isDelete"];

    const safeFilters = Object.keys(filterData)
        .filter((key) => allowedFilters.includes(key))
        .map((key) => ({
            [key]: { equals: filterData[key] },
        }));

    if (safeFilters.length > 0) {
        andConditions.push({ AND: safeFilters });
    }

    const whereConditions: Prisma.UserWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy:
            sortBy && sortOrder
                ? { [sortBy]: sortOrder }
                : { createdAt: "desc" },

        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            phone: true,
            bio: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,

            admin: {
                select: {
                    adminLevel: true,
                    permissions: true,
                },
            },
            member: {
                select: {
                    studentId: true,
                    department: true,
                    session: true,
                    learningTrack: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            mentor: {
                select: {
                    designation: true,
                    expertise: true,
                    experience: true,
                },
            },
            moderator: {
                select: {
                    moderationLevel: true,
                },
            },
        },
    });

    const mappedUsers = users.map((user) => {
        let profile: any = null;

        switch (user.role) {
            case UserRole.ADMIN:
                profile = user.admin;
                break;
            case UserRole.MEMBER:
                profile = user.member;
                break;
            case UserRole.MENTOR:
                profile = user.mentor;
                break;
            case UserRole.MODERATOR:
                profile = user.moderator;
                break;
            default:
                profile = null;
        }

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            phone: user.phone,
            bio: user.bio,
            isActive: user.isActive,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            profile,
        };
    });

    const total = await prisma.user.count({ where: whereConditions });

    return {
        meta: { page, limit, total },
        data: mappedUsers,
    };
};

/* =====================================================
   GET ME (FIXED: findFirst)
===================================================== */
const getMe = async (email: string) => {
    const user = await prisma.user.findFirst({
        where: {
            email,
            isDelete: false,
        },
        include: {
            admin: true,
            mentor: true,
            moderator: true,
            memberApplication: true,
            member: {
                include: {
                    department: true,
                    session: true,
                    learningTrack: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, "User not found");
    }

    let roleSpecificData: any = null;

    switch (user.role) {
        case UserRole.ADMIN:
            roleSpecificData = {
                adminLevel: user.admin?.adminLevel,
                permissions: user.admin?.permissions ?? [],
                github: user.admin?.github,
                linkedin: user.admin?.linkedin,
                portfolio: user.admin?.portfolio,
                skills: user.admin?.skills,
            };
            break;

        case UserRole.MEMBER:
            roleSpecificData = {
                studentId: user.member?.studentId,
                department: user.member?.department,
                session: user.member?.session,
                learningTrack: user.member?.learningTrack,
                batch: user.member?.batch,
                skills: user.member?.skills ?? [],
                github: user.member?.github,
                linkedin: user.member?.linkedin,
            };
            break;

        case UserRole.MENTOR:
            roleSpecificData = {
                expertise: user.mentor?.expertise,
                designation: user.mentor?.designation,
                company: user.mentor?.company,
                experience: user.mentor?.experience,
                github: user.mentor?.github,
                linkedin: user.mentor?.linkedin,
            };
            break;

        case UserRole.MODERATOR:
            roleSpecificData = {
                permissions: user.moderator?.permissions ?? [],
                moderationLevel: user.moderator?.moderationLevel,
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
        profile: roleSpecificData,
        memberShipApplication: user.memberApplication ?? null,
    };
};

/* =====================================================
   SOFT DELETE
===================================================== */
const SoftDelete = async (id: string) => {
    return prisma.user.update({
        where: { id },
        data: {
            isDelete: true,
            isActive: false,
            deletedAt: new Date(),
        },
    });
};

/* =====================================================
   CREATE ROLE BASE USER
===================================================== */
export const createRoleBaseUser = async (data: any) => {
    const { email, role } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, "User not found");
    }

    if (user.role === role) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `${role} already exists for this user`
        );
    }

    switch (role) {
        case UserRole.ADMIN:
            await prisma.admin.create({
                data: {
                    userId: user.id,
                    adminLevel: data.adminLevel ?? "BASIC",
                    permissions: [],
                },
            });
            break;

        case UserRole.MENTOR:
            await prisma.mentor.create({
                data: {
                    userId: user.id,
                    expertise: data.expertise,
                    designation: data.designation,
                    experience: data.experience,
                    subExpertise: [],
                },
            });
            break;

        case UserRole.MODERATOR:
            await prisma.moderator.create({
                data: {
                    userId: user.id,
                    permissions: [],
                    assignedForums: [],
                },
            });
            break;

        default:
            throw new ApiError(statusCode.BAD_REQUEST, "Invalid role");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { role },
    });

    return { message: `${role} created successfully` };
};

/* =====================================================
   UPDATE USER
===================================================== */
export const updateUser = async (req: Request) => {
    const file = req.file;

    if (file) {
        const uploaded = await fileUploader.uploadToCloudinary(file);
        req.body.profileImage = uploaded.secure_url;
    }

    const { id, roleData, ...userData } = req.body;

    const parsedRoleData =
        roleData && typeof roleData === "string"
            ? JSON.parse(roleData)
            : roleData;

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id } });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (Object.keys(userData).length > 0) {
            await tx.user.update({
                where: { id },
                data: userData,
            });
        }

        if (parsedRoleData && Object.keys(parsedRoleData).length > 0) {
            switch (user.role) {
                case UserRole.ADMIN:
                    await tx.admin.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;

                case UserRole.MEMBER: {
                    const { departmentId, sessionId, ...memberData } =
                        parsedRoleData;

                    await tx.member.update({
                        where: { userId: id },
                        data: {
                            ...memberData,
                            ...(departmentId && {
                                department: { connect: { id: departmentId } },
                            }),
                            ...(sessionId && {
                                session: { connect: { id: sessionId } },
                            }),
                        },
                    });
                    break;
                }

                case UserRole.MENTOR:
                    await tx.mentor.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;

                case UserRole.MODERATOR:
                    await tx.moderator.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;

                default:
                    throw new ApiError(400, "Invalid role");
            }
        }

        return { success: true };
    });
};

/* =====================================================
   EXPORT
===================================================== */
export const UserService = {
    getAllUsers,
    getMe,
    SoftDelete,
    createRoleBaseUser,
    updateUser,
};
