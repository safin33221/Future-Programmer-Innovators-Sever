import { z } from "zod";

/* =========================
   Create Notice Validation
========================= */

const createNoticeSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().optional(),
    }),
});


/* =========================
   Update Notice Validation
========================= */
const updateNoticeSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .optional(),

        content: z.string().optional(),
    }),
});

/* =========================
   Publish Notice Validation
========================= */
const publishNoticeSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Notice ID is required"),
    }),
});

/* =========================
   Notice ID Param Validation
========================= */
const noticeIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Notice ID is required"),
    }),
});

export const NoticeValidation = {
    createNoticeSchema,
    updateNoticeSchema,
    publishNoticeSchema,
    noticeIdParamSchema,
};
