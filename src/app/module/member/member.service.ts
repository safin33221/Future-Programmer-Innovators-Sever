import prisma from "../../../lib/prisma.js";
import { Prisma, ApplicationStatus } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import { memberApplicationSearchableFields } from "./member.constant.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";


/**
 * MEMBER → Apply for membership
 */
const createMemberApplication = async (userId: string, payload: any) => {
    console.log({ userId });
    const exists = await prisma.memberApplication.findUnique({
        where: { userId },
    });

    console.log({ exists });
    if (exists) {
        throw new ApiError(statusCode.NOT_ACCEPTABLE, "You have already applied for membership");
    }

    return prisma.memberApplication.create({
        data: {
            userId,
            studentId: payload.studentId,
            departmentId: payload.departmentId,
            sessionId: payload.sessionId,
            profileImage: payload.profileImage,
        },
    });
};

/**
 * ADMIN → Get all applications (pagination + search + filter)
 */
const getAllApplications = async (params: any, options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.MemberApplicationWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: memberApplicationSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key],
                },
            })),
        });
    }

    const whereConditions: Prisma.MemberApplicationWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const applications = await prisma.memberApplication.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            department: true,
            session: true,
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const total = await prisma.memberApplication.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: applications,
    };
};

/**
 * ADMIN → Approve application
 * → creates Member
 * → updates application status
 */
const approveApplication = async (applicationId: string) => {
    return prisma.$transaction(async (tx) => {
        const application = await tx.memberApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new Error("Application not found");
        }

        if (application.status !== ApplicationStatus.PENDING) {
            throw new Error("Application already reviewed");
        }

        await tx.member.create({
            data: {
                userId: application.userId,
                studentId: application.studentId,
                departmentId: application.departmentId,
                sessionId: application.sessionId,
                profileImage: application.profileImage,
            },
        });

        return tx.memberApplication.update({
            where: { id: applicationId },
            data: {
                status: ApplicationStatus.APPROVED,
            },
        });
    });
};

/**
 * ADMIN → Reject application
 */
const rejectApplication = async (applicationId: string) => {
    const application = await prisma.memberApplication.findUnique({
        where: { id: applicationId },
    });

    if (!application) {
        throw new Error("Application not found");
    }

    if (application.status !== ApplicationStatus.PENDING) {
        throw new Error("Application already reviewed");
    }

    return prisma.memberApplication.update({
        where: { id: applicationId },
        data: {
            status: ApplicationStatus.REJECTED,
        },
    });
};

export const MemberService = {
    createMemberApplication,
    getAllApplications,
    approveApplication,
    rejectApplication,
};
