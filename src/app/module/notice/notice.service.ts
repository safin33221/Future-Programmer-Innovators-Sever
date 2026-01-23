import prisma from "../../../lib/prisma.js";

/* =========================
   Create Notice
========================= */
const createNotice = async (
    userId: string,
    payload: {
        title: string;
        content?: string;
    }
) => {
    console.log({ payload });
    const result = await prisma.notice.create({
        data: {
            title: payload.title,
            content: payload.content,

            createdBy: {
                connect: {
                    id: userId,
                },
            },
        },
    });

    return result;
};

/* =========================
   Get Published Notices (Public)
========================= */
const getPublishedNotices = async (
    filters: any,
    options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }
) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
        published: true,
        isDeleted: false,
    };

    if (filters?.title) {
        whereConditions.title = {
            contains: filters.title,
            mode: "insensitive",
        };
    }

    const data = await prisma.notice.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [options.sortBy || "createdAt"]: options.sortOrder || "desc",
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    const total = await prisma.notice.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};

const getAllNoticesForAdmin = async (
    filters: any,
    options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }
) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
        isDeleted: false, // ✅ only deleted filtered
    };

    if (filters?.title) {
        whereConditions.title = {
            contains: filters.title,
            mode: "insensitive",
        };
    }

    if (filters?.published !== undefined) {
        whereConditions.published = filters.published === "true";
    }

    const data = await prisma.notice.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [options.sortBy || "createdAt"]: options.sortOrder || "desc",
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    const total = await prisma.notice.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};




/* =========================
   Get Single Notice
========================= */
const getSingleNotice = async (id: string) => {
    const notice = await prisma.notice.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });

    if (!notice) {
        throw new Error("Notice not found");
    }

    return notice;
};

/* =========================
   Update Notice
========================= */
const updateNotice = async (
    id: string,
    payload: {
        title?: string;
        content?: string;
    }
) => {
    const existingNotice = await prisma.notice.findUnique({
        where: { id },
    });

    if (!existingNotice || existingNotice.isDeleted) {
        throw new Error("Notice not found");
    }

    const result = await prisma.notice.update({
        where: { id },
        data: payload,
    });

    return result;
};

/* =========================
   Publish Notice
========================= */
const publishNotice = async (id: string) => {
    const notice = await prisma.notice.findUnique({
        where: { id },
    });

    if (!notice || notice.isDeleted) {
        throw new Error("Notice not found");
    }

    const result = await prisma.notice.update({
        where: { id },
        data: {
            published: true,
            publishedAt: new Date(),
        },
    });

    return result;
};

/* =========================
   Soft Delete Notice
========================= */
const softDeleteNotice = async (id: string) => {
    const notice = await prisma.notice.findUnique({
        where: { id },
    });

    if (!notice || notice.isDeleted) {
        throw new Error("Notice not found");
    }

    const result = await prisma.notice.update({
        where: { id },
        data: {
            isDeleted: true,
        },
    });

    return result;
};

export const NoticeService = {
    createNotice,
    getPublishedNotices,
    getSingleNotice,
    updateNotice,
    publishNotice,
    softDeleteNotice,
    getAllNoticesForAdmin
};


