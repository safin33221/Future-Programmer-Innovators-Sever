import prisma from "../../../lib/prisma.js";

const createDepartment = async (payload: { name: string }) => {
    const exists = await prisma.department.findUnique({
        where: { name: payload.name },
    });

    if (exists) {
        throw new Error("Department already exists");
    }

    return prisma.department.create({
        data: {
            name: payload.name,
        },
    });
};

export const getAllDepartments = async () => {
    return prisma.department.findMany({
        orderBy: {
            name: "asc",
        },
        include: {
            _count: {
                select: {
                    members: true,
                    memberApplications: true,
                },
            },
        },
    });
};


const getDepartmentById = async (id: string) => {
    return prisma.department.findUnique({
        where: { id },
    });
};

const softDeleteDepartment = async (id: string) => {
    return prisma.department.update({
        where: { id },
        data: {
            isDeleted: true
        }

    });
};

export const DepartmentService = {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    softDeleteDepartment,
};
