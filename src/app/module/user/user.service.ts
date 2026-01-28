import { userSearchableFields } from "./user.constant.js";
import prisma from "../../../lib/prisma.js";
import { Prisma, UserRole } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";


const getAllUsers = async (params: any, options: IOptions) => {

    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)
    const { searchTerm, ...filterData } = params;
    console.log(searchTerm);

    const andConditions: Prisma.UserWhereInput[] = [];
    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }))
        });
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

        orderBy:
            sortBy && sortOrder
                ? { [sortBy]: sortOrder }
                : { createdAt: "desc" },

        select: {
            // 🔹 Core user fields
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

            // 🔹 Role-specific (ONE will exist)
            admin: {
                select: {
                    adminLevel: true,
                    department: true,
                },
            },

            member: {
                select: {
                    studentId: true,
                    batch: true,
                    departmentId: true,
                    sessionId: true,
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


export const createRoleBaseUser = async (
    data: any
) => {
    console.log("consol on service", data);
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





export const UserService = {
    createRoleBaseUser,
    getAllUsers,
    getMe,
    SoftDelete
};
