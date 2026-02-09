import { userSearchableFields } from "./user.constant.js";
import prisma from "../../../lib/prisma.js";
import { Prisma, User, UserRole } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";
import type { Request } from "express";
import { fileUploader } from "../../helper/fileUploader.js";






export const getAllUsers = async (params: any, options: IOptions) => {
    /* ---------------- PAGINATION ---------------- */
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    /* ---------------- WHERE CONDITIONS ---------------- */
    const andConditions: Prisma.UserWhereInput[] = [];

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

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: {
                    equals: (filterData as any)[key],
                },
            })),
        });
    }

    const whereConditions: Prisma.UserWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    /* ---------------- DB QUERY ---------------- */
    const users = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy:
            sortBy && sortOrder
                ? { [sortBy]: sortOrder }
                : { createdAt: "desc" },

        select: {
            // core user fields
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

            // role relations
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

    /* ---------------- ROLE → PROFILE MAPPER ---------------- */
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
                profile = null; // BASIC USER
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
            lastLoginAt: user.lastLoginAt,
            updatedAt: user.updatedAt,
            profile, // ✅ role-based unified profile
        };
    });

    /* ---------------- TOTAL COUNT ---------------- */
    const total = await prisma.user.count({
        where: whereConditions,
    });

    /* ---------------- FINAL RESPONSE ---------------- */
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: mappedUsers,
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
            memberApplication: true,
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
                permissions: user.admin?.permissions || [],

                github: user.admin?.github,
                linkedin: user.admin?.linkedin,
                portfolio: user.admin?.portfolio,
                skills: user.admin?.skills,
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
        profile: roleSpecificData,
        memberShipApplication: user.memberApplication || null
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


export const createRoleBaseUser = async (
    data: any
) => {

    const { email, role } = data;

    // 1️⃣ Check user exists
    const user = await prisma.user.findUnique({
        where: { email },
    });


    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, "User not found");
    }
    // if (!user.isVerified || !user.isActive || user.isDelete) {
    //     throw new ApiError(statusCode.BAD_REQUEST, `User is not eligible for ${role} assignment. because -
    //     isVerified: ${user.isVerified},
    //     isActive: ${user.isActive},
    //     isDelete: ${user.isDelete}`);
    // }

    // 2️⃣ Prevent duplicate role creation
    if (role === user.role) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `${role} already exists for this user`
        );
    }

    // 3️⃣ Role specific creation
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
                    expertise: data.expertise!,
                    designation: data.designation!,
                    experience: data.experience!,
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
            throw new ApiError(
                statusCode.BAD_REQUEST,
                "Invalid role"
            );
    }

    // 4️⃣ Update user role
    await prisma.user.update({
        where: { id: user.id },
        data: { role },
    });

    return {
        message: `${role} created successfully`,
    };
};

export const updateUser = async (req: Request) => {
    const file = req.file;

    /* ---------- image upload ---------- */
    if (file) {
        const uploaded = await fileUploader.uploadToCloudinary(file);
        req.body.profileImage = uploaded.secure_url;
    }

    const { id, roleData, ...userData } = req.body;

    /* ---------- parse roleData ---------- */
    let parsedRoleData: any = null;
    if (roleData && typeof roleData === "string") {
        parsedRoleData = JSON.parse(roleData);
    }

    return prisma.$transaction(async (tx) => {
        /* 1️⃣ find user */
        const user = await tx.user.findUnique({ where: { id } });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        /* 2️⃣ update base user */
        if (Object.keys(userData).length > 0) {
            await tx.user.update({
                where: { id },
                data: userData,
            });
        }

        /* 3️⃣ role-specific update (NO blind upsert) */
        if (parsedRoleData && Object.keys(parsedRoleData).length > 0) {
            switch (user.role) {

                /* ================= ADMIN ================= */
                case "ADMIN": {
                    const admin = await tx.admin.findUnique({
                        where: { userId: id },
                    });

                    if (!admin) {
                        throw new ApiError(404, "Admin not found");
                    }

                    await tx.admin.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;
                }

                /* ================= MEMBER ================= */
                case "MEMBER": {
                    const member = await tx.member.findUnique({
                        where: { userId: id },
                    });

                    if (!member) {
                        throw new ApiError(404, "Member not found");
                    }

                    const {
                        departmentId,
                        sessionId,
                        ...memberData
                    } = parsedRoleData;

                    await tx.member.update({
                        where: { userId: id },
                        data: {
                            ...memberData,

                            ...(departmentId && {
                                department: {
                                    connect: { id: departmentId },
                                },
                            }),

                            ...(sessionId && {
                                session: {
                                    connect: { id: sessionId },
                                },
                            }),
                        },
                    });
                    break;
                }

                /* ================= MENTOR ================= */
                case "MENTOR": {
                    const mentor = await tx.mentor.findUnique({
                        where: { userId: id },
                    });

                    if (!mentor) {
                        throw new ApiError(404, "Mentor not found");
                    }

                    await tx.mentor.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;
                }

                /* ================= MODERATOR ================= */
                case "MODERATOR": {
                    const moderator = await tx.moderator.findUnique({
                        where: { userId: id },
                    });

                    if (!moderator) {
                        throw new ApiError(404, "Moderator not found");
                    }

                    await tx.moderator.update({
                        where: { userId: id },
                        data: parsedRoleData,
                    });
                    break;
                }

                default:
                    throw new ApiError(400, "Invalid role");
            }
        }

        return { success: true };
    });
};

export const UserService = {
    createRoleBaseUser,
    getAllUsers,
    getMe,
    SoftDelete,
    updateUser
};
