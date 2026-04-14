declare module 'cors';
declare module 'helmet';
declare module 'morgan';
declare module 'uuid';
declare module 'jsonwebtoken';

declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: any;
    ip: string;
    method: string;
    path: string;
    url: string;
    get(name: string): string | undefined;
    [key: string]: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body?: any): Response;
    send(body?: any): Response;
    sendStatus(code: number): Response;
    redirect(url: string): void;
    set(field: string, value: string): Response;
    headersSent: boolean;
    [key: string]: any;
  }

  export interface NextFunction {
    (err?: any): void;
  }

  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): any;
  }

  export interface ErrorRequestHandler {
    (err: any, req: Request, res: Response, next: NextFunction): any;
  }

  interface IRouter {
    use(...handlers: any[]): IRouter;
    get(path: string, ...handlers: any[]): IRouter;
    post(path: string, ...handlers: any[]): IRouter;
    put(path: string, ...handlers: any[]): IRouter;
    patch(path: string, ...handlers: any[]): IRouter;
    delete(path: string, ...handlers: any[]): IRouter;
    [key: string]: any;
  }

  export function Router(): IRouter;

  interface Application extends IRouter {
    listen(port: number, hostname: string, callback?: () => void): any;
    listen(port: number, callback?: () => void): any;
    [key: string]: any;
  }

  interface ExpressStatic {
    (): Application;
    Router(): IRouter;
    json(options?: any): any;
    raw(options?: any): any;
    urlencoded(options?: any): any;
    static(root: string, options?: any): any;
    [key: string]: any;
  }

  const e: ExpressStatic;
  export default e;
}
