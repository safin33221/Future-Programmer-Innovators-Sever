import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateRequest =
    (schema: ZodTypeAny) =>
        async (
            req: Request,
            res: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                await schema.parseAsync({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });

                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.issues, // ✅ correct
                    });
                    return;
                }

                next(error);
            }
        };
