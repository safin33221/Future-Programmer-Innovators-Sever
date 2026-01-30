import prisma from "../../../lib/prisma.js";
import { Prisma, ApplicationStatus } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import { memberApplicationSearchableFields } from "./member.constant.js";
import ApiError from "../../errors/ApiError.js";
import { statusCode } from "../../shared/statusCode.js";


/**
 * MEMBER → Apply for membership
 */
const createMemberApplication = async (
    userId: string,
    payload: any
) => {

    const existing = await prisma.memberApplication.findUnique({
        where: { userId },
    });

    /* ===============================
       IF APPLICATION EXISTS
    =============================== */
    if (existing) {
        if (existing.status === ApplicationStatus.PENDING) {
            throw new ApiError(
                statusCode.NOT_ACCEPTABLE,
                "Your application is under review"
            );
        }

        if (existing.status === ApplicationStatus.APPROVED) {
            throw new ApiError(
                statusCode.NOT_ACCEPTABLE,
                "Your application is already approved"
            );
        }

        // ✅ REJECTED → RESUBMIT (UPDATE)
        if (existing.status === ApplicationStatus.REJECTED) {
            return prisma.memberApplication.update({
                where: { id: existing.id },
                data: {
                    studentId: payload.studentId,

                    department: {
                        connect: { id: payload.departmentId },
                    },

                    session: {
                        connect: { id: payload.sessionId },
                    },

                    learningTrack: payload.interests
                        ? { connect: { id: payload.interests } }
                        : { disconnect: true },
                    phoneNumber: payload.phoneNumber,
                    profileImage: payload.profileImage ?? null,
                    joinMotivation: payload.motivation,

                    status: ApplicationStatus.PENDING,
                    reviewComment: null,
                    reviewedAt: null,
                },
            });
        }

    }

    /* ===============================
       FIRST TIME SUBMIT
    =============================== */
    return prisma.memberApplication.create({
        data: {
            userId,
            studentId: payload.studentId,

            departmentId: payload.departmentId,
            sessionId: payload.sessionId,
            learningTrackId: payload.interests ?? null,
            phoneNumber: payload.phoneNumber,
            interestedAreas: payload.interestedAreas ?? [],
            profileImage: payload.profileImage ?? null,
            joinMotivation: payload.motivation ?? null,

            status: ApplicationStatus.PENDING,
        },
    });

};

/**
 * ADMIN → Get all applications (pagination + search + filter)
 */

export const getAllApplications = async (
    params: any,
    options: IOptions
) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.MemberApplicationWhereInput[] = [];

    /* ===============================
       SEARCH
    =============================== */
    if (searchTerm) {
        andConditions.push({
            OR: [
                {
                    studentId: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    user: {
                        firstName: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    user: {
                        lastName: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    user: {
                        email: {
                            contains: searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
            ],
        });
    }

    /* ===============================
       FILTER
    =============================== */
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.entries(filterData).map(([key, value]) => ({
                [key]: {
                    equals: value,
                },
            })),
        });
    }

    const whereConditions: Prisma.MemberApplicationWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    /* ===============================
       QUERY
    =============================== */
    const applications = await prisma.memberApplication.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy ?? "createdAt"]: sortOrder ?? "desc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            department: {
                select: {
                    id: true,
                    name: true,
                },
            },
            session: {
                select: {
                    id: true,
                    name: true,
                },
            },
            learningTrack: {
                select: {
                    id: true,
                    name: true,
                },
            },
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
export const approveApplication = async (applicationId: string) => {
    return prisma.$transaction(async (tx) => {

        /* ===============================
           1. GET APPLICATION
        =============================== */
        const application = await tx.memberApplication.findUnique({
            where: { id: applicationId },
            select: {
                id: true,
                status: true,
                userId: true,
                studentId: true,
                departmentId: true,
                sessionId: true,
                phoneNumber: true,

            },
        });

        if (!application) {
            throw new ApiError(statusCode.NOT_FOUND, "Application not found");
        }

        if (application.status !== ApplicationStatus.PENDING) {
            throw new ApiError(statusCode.NOT_FOUND, "Application already reviewed");
        }

        if (!application.userId) {
            throw new ApiError(statusCode.NOT_FOUND, "Application user missing");
        }

        /* ===============================
           2. CHECK MEMBER EXISTS
        =============================== */
        const existingMember = await tx.member.findUnique({
            where: {
                userId: application.userId,
            },
        });

        if (existingMember) {
            throw new ApiError(statusCode.NOT_FOUND, "User is already a member");
        }

        /* ===============================
           3. CREATE MEMBER
        =============================== */
        await tx.user.update({
            where: { id: application.userId },
            data: {
                role: "MEMBER",
                phone: application.phoneNumber
            },

        });

        await tx.member.create({
            data: {
                userId: application.userId,
                studentId: application.studentId,
                departmentId: application.departmentId,
                sessionId: application.sessionId,
            },
        });

        /* ===============================
           4. UPDATE APPLICATION STATUS
        =============================== */
        const updatedApplication = await tx.memberApplication.update({
            where: { id: applicationId },
            data: {
                status: ApplicationStatus.APPROVED,
            },
        });

        return updatedApplication;
    });
};

/**
 * ADMIN → Reject application
 */


const rejectApplication = async (
    applicationId: string,
    reviewComment: string
) => {
    if (!reviewComment?.trim()) {
        throw new ApiError(statusCode.BAD_REQUEST, "Review comment is required");
    }

    const application = await prisma.memberApplication.findUnique({
        where: { id: applicationId },
    });

    if (!application) {
        throw new ApiError(statusCode.BAD_REQUEST, "Application not found");
    }

    if (application.status !== ApplicationStatus.PENDING) {
        throw new ApiError(statusCode.BAD_REQUEST, "Application already reviewed");
    }

    return prisma.memberApplication.update({
        where: { id: applicationId },
        data: {
            status: ApplicationStatus.REJECTED,
            reviewComment,
            reviewedAt: new Date(),
        },
    });
};

export default rejectApplication;


export const MemberService = {
    createMemberApplication,
    getAllApplications,
    approveApplication,
    rejectApplication,
};
