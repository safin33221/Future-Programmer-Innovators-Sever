import prisma from "../../../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper.js";
import { learningTrackSearchableFields } from "./learningTrack.constant.js";




const createLearningTrack = async (payload: any) => {
    // Check if slug already exists

    const slugGenerate = payload.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    const existingTrack = await prisma.learningTrack.findUnique({
        where: { slug: slugGenerate }
    });

    if (existingTrack) {
        throw new Error(`Slug "${payload.slug}" is already taken`);
    }

    return await prisma.$transaction(async (tx) => {
        const learningTrack = await tx.learningTrack.create({
            data: {
                name: payload.name,
                slug: slugGenerate,
                shortDesc: payload.shortDesc,
                longDesc: payload.longDesc,
                duration: payload.duration,
                difficulty: payload.difficulty,
                icon: payload.icon || null,
                isActive: payload.isActive,
                topics: {
                    create: payload.topics.map((topic: any) => ({
                        title: topic.title,
                        order: topic.order
                    }))
                },
                roadmaps: {
                    create: payload.roadmaps.map((roadmap: any) => ({
                        phase: roadmap.phase,
                        description: roadmap.description,
                        order: roadmap.order
                    }))
                },
                careers: {
                    create: payload.careers.map((career: any) => ({
                        role: career.role,
                        details: career.details
                    }))
                },
                tools: {
                    create: payload.tools.map((tool: any) => ({
                        name: tool.name,
                        icon: tool.icon || null
                    }))
                }
            },
            include: {
                topics: true,
                roadmaps: true,
                careers: true,
                tools: true
            }
        });

        return learningTrack;
    });


}



export const getAllLearningTracks = async (params: any, options: IOptions) => {
    const { page = 1, limit = 10, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.LearningTrackWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: learningTrackSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        const filterConditions: Prisma.LearningTrackWhereInput[] = [];

        Object.keys(filterData).forEach((key) => {
            if (filterData[key]) {
                filterConditions.push({
                    [key]: {
                        equals: filterData[key],
                    },
                });
            }
        });

        if (filterConditions.length > 0) {
            andConditions.push({ AND: filterConditions });
        }
    }

    const whereConditions: Prisma.LearningTrackWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    // Fetch all learning tracks - MemberApplication model এর actual fields
    const tracks = await prisma.learningTrack.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            // Include topics
            topics: {
                orderBy: {
                    order: 'asc',
                },
            },

            // Include roadmaps
            roadmaps: {
                orderBy: {
                    order: 'asc',
                },
            },

            // Include careers
            careers: true,

            // Include tools
            tools: true,

            // Include members
            members: {
                select: {
                    id: true,
                    userId: true,
                    studentId: true,
                    profileImage: true,
                    departmentId: true,
                    sessionId: true,
                    learningTrackId: true,
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
            },

            // Include applications - MemberApplication model এর actual fields
            applications: {
                select: {
                    id: true,
                    status: true,
                    // আপনার MemberApplication model এর actual fields:
                    // appliedAt: true, // যদি থাকে
                    // createdAt: true, // সাধারণত এটা থাকে
                    // updatedAt: true,
                    userId: true,
                    studentId: true,
                    departmentId: true,
                    sessionId: true,
                    profileImage: true,
                    interestedAreas: true,
                    learningTrackId: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            admin: {
                                select: {
                                    profileImage: true,
                                },
                            },
                            member: {
                                select: {
                                    profileImage: true,
                                },
                            },
                            mentor: {
                                select: {
                                    profileImage: true,
                                },
                            },
                            moderator: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },

            // Count aggregations
            _count: {
                select: {
                    members: true,
                    applications: true,
                    topics: true,
                    roadmaps: true,
                    careers: true,
                    tools: true,
                },
            },
        },
    });

    // Transform the data
    const transformedTracks = tracks.map((track) => {
        // Transform members
        const transformedMembers = track.members.map((member) => ({
            ...member,
            user: {
                ...member.user,
                fullName: `${member.user.firstName} ${member.user.lastName}`,
                profileImage: member.profileImage,
            },
        }));

        // Transform applications
        const transformedApplications = track.applications.map((app) => {
            // Determine profile image from related models
            let profileImage = app.profileImage || null; // প্রথমে application-এর profileImage check করুন

            if (!profileImage) {
                if (app.user.admin?.profileImage) {
                    profileImage = app.user.admin.profileImage;
                } else if (app.user.member?.profileImage) {
                    profileImage = app.user.member.profileImage;
                } else if (app.user.mentor?.profileImage) {
                    profileImage = app.user.mentor.profileImage;
                }
            }

            return {
                id: app.id,
                status: app.status,
                // যদি createdAt থাকে তাহলে appliedAt হিসেবে ব্যবহার করুন
                appliedAt: (app as any).createdAt || (app as any).appliedAt || null,
                userId: app.userId,
                studentId: app.studentId,
                departmentId: app.departmentId,
                sessionId: app.sessionId,
                profileImage: app.profileImage,
                interestedAreas: app.interestedAreas,
                learningTrackId: app.learningTrackId,
                user: {
                    id: app.user.id,
                    firstName: app.user.firstName,
                    lastName: app.user.lastName,
                    email: app.user.email,
                    profileImage,
                    fullName: `${app.user.firstName} ${app.user.lastName}`,
                },
            };
        });

        return {
            ...track,
            members: transformedMembers,
            applications: transformedApplications,
            memberCount: track._count.members,
            applicationCount: track._count.applications,
            topicCount: track._count.topics,
            roadmapCount: track._count.roadmaps,
            careerCount: track._count.careers,
            toolCount: track._count.tools,
            // Remove the _count object
            _count: undefined,
        };
    });

    const total = await prisma.learningTrack.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: transformedTracks,
    };
};

const getSingleLearningTrack = async (slug: string) => {
    return prisma.learningTrack.findUnique({
        where: { slug },
        include: {
            topics: { orderBy: { order: "asc" } },
            roadmaps: { orderBy: { order: "asc" } },
            careers: true,
            tools: true,
        },
    });
};

const updateLearningTrack = async (id: string, payload: any) => {
    return prisma.learningTrack.update({
        where: { id },
        data: payload,
    });
};

const softDeleteLearningTrack = async (id: string) => {
    console.log({ id });
    return prisma.learningTrack.update({
        where: { id },
        data: {
            isActive: false,
            deletedAt: new Date(),
            isDeleted: true
        },
    });
}

export const LearningTrackService = {
    createLearningTrack,
    getAllLearningTracks,
    getSingleLearningTrack,
    updateLearningTrack,
    softDeleteLearningTrack,
};
