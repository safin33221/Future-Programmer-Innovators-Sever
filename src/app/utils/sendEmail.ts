import nodemailer from "nodemailer";

import path from "path";
import ejs from "ejs";
import envConfig from "../config/env.config.js";

const transporter = nodemailer.createTransport({
    host: envConfig.SMTP.SMTP_HOST,
    port: Number(envConfig.SMTP.SMTP_PORT),
    secure: Number(envConfig.SMTP.SMTP_PORT) === 465,
    auth: {
        user: envConfig.SMTP.SMTP_USER,
        pass: envConfig.SMTP.SMTP_PASS,
    },
});

interface SendEmailOption {
    to: string;
    subject: string;
    templateName: string;
    templateData?: Record<string, any>;
    attachments?: {
        fileName: string;
        content?: Buffer | string;
        path?: string;
        contentType?: string;
    }[];
}

export const sendEmail = async ({
    to,
    subject,
    templateName,
    templateData = {},
    attachments,
}: SendEmailOption) => {
    try {
        const templatePath = path.resolve(
            process.cwd(),
            "src",
            "app",
            "utils",
            "templates",
            `${templateName}.ejs`
        );

        const html = await ejs.renderFile(templatePath, templateData);;

        const info = await transporter.sendMail({
            from: envConfig.SMTP.SMTP_FROM_EMAIL,
            to,
            subject,
            html,
            attachments: attachments?.map((a) => ({
                filename: a.fileName,
                content: a.content,
                path: a.path,
                contentType: a.contentType,
            })),
        });

        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    } catch (error: any) {
        console.error("Email sending error:", error);
        throw new Error(error.message || "Email sending failed");
    }
};
