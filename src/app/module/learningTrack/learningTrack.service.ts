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
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination(options);

    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.LearningTrackWhereInput[] = [];

    // Search across multiple fields
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

    // Add filters
    if (Object.keys(filterData).length > 0) {
        const filterConditions: Prisma.LearningTrackWhereInput[] = [];

        Object.keys(filterData).forEach((key) => {
            if (filterData[key] !== undefined && filterData[key] !== '') {
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

    // Exclude deleted tracks
    andConditions.push({
        isDeleted: false,
    });

    const whereConditions: Prisma.LearningTrackWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    // Fetch all learning tracks
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
                select: {
                    id: true,
                    title: true,
                    order: true,
                },
            },
            // Include roadmaps
            roadmaps: {
                orderBy: {
                    order: 'asc',
                },
                select: {
                    id: true,
                    phase: true,
                    description: true,
                    order: true,
                },
            },
            // Include careers
            careers: {
                select: {
                    id: true,
                    role: true,
                    details: true,
                },
            },
            // Include tools
            tools: {
                select: {
                    id: true,
                    name: true,
                    icon: true,
                },
            },
            // Include members - FIXED: Remove profileImage from Member select
            members: {
                select: {
                    id: true,
                    userId: true,
                    studentId: true,
                    // REMOVE: profileImage: true, // This doesn't exist in Member model
                    departmentId: true,
                    sessionId: true,
                    batch: true,
                    skills: true,
                    github: true,
                    linkedin: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true, // profileImage is in User model
                            phone: true,
                            bio: true,
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
                },
            },
            // Include applications - FIXED: Update based on your actual MemberApplication model
            applications: {
                select: {
                    id: true,
                    status: true,
                    studentId: true,
                    departmentId: true,
                    sessionId: true,
                    interestedAreas: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profileImage: true, // From User model
                            phone: true,
                            bio: true,
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
            id: member.id,
            userId: member.userId,
            studentId: member.studentId,
            // Remove profileImage from here
            departmentId: member.departmentId,
            sessionId: member.sessionId,
            batch: member.batch,
            skills: member.skills,
            github: member.github,
            linkedin: member.linkedin,
            user: {
                id: member.user.id,
                firstName: member.user.firstName,
                lastName: member.user.lastName,
                email: member.user.email,
                profileImage: member.user.profileImage, // From User model
                phone: member.user.phone,
                bio: member.user.bio,
                fullName: `${member.user.firstName} ${member.user.lastName}`,
            },
            department: member.department,
            session: member.session,
        }));

        // Transform applications
        const transformedApplications = track.applications.map((app) => ({
            id: app.id,
            status: app.status,
            appliedAt: app.createdAt, // Use createdAt as appliedAt
            studentId: app.studentId,
            departmentId: app.departmentId,
            sessionId: app.sessionId,
            interestedAreas: app.interestedAreas,
            learningTrackId: track.id,
            user: {
                id: app.user.id,
                firstName: app.user.firstName,
                lastName: app.user.lastName,
                email: app.user.email,
                profileImage: app.user.profileImage, // From User model
                phone: app.user.phone,
                bio: app.user.bio,
                fullName: `${app.user.firstName} ${app.user.lastName}`,
            },
        }));

        return {
            id: track.id,
            name: track.name,
            slug: track.slug,
            shortDesc: track.shortDesc,
            longDesc: track.longDesc,
            icon: track.icon,
            difficulty: track.difficulty,
            duration: track.duration,
            isActive: track.isActive,
            isDeleted: track.isDeleted,
            createdAt: track.createdAt,
            updatedAt: track.updatedAt,

            // Related data
            topics: track.topics,
            roadmaps: track.roadmaps,
            careers: track.careers,
            tools: track.tools,
            members: transformedMembers,
            applications: transformedApplications,

            // Counts
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
