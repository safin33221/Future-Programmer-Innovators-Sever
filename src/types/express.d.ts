import type * as core from "express-serve-static-core";

declare module "express" {
  export interface Application extends core.Application {}

  export interface Request<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = core.Query,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > extends core.Request<P, ResBody, ReqBody, ReqQuery, LocalsObj> {}

  export interface Response<
    ResBody = any,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > extends core.Response<ResBody, LocalsObj> {}

  export interface Router extends core.Router {}
  export type NextFunction = core.NextFunction;
  export type RequestHandler<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = core.Query,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > = core.RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>;
}
