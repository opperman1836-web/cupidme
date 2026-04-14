// Fallback type declarations for when @types/* packages are unavailable.
// These are only used if the real @types packages can't be found.

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
    userId?: string;
    userRole?: string;
    accessToken?: string;
    get(name: string): string | undefined;
  }

  export interface Response {
    status(code: number): Response;
    json(body?: any): Response;
    send(body?: any): Response;
    sendStatus(code: number): Response;
    redirect(url: string): void;
    set(field: string, value: string): Response;
    headersSent: boolean;
  }

  export interface NextFunction {
    (err?: any): void;
  }

  export interface IRouter {
    use(...handlers: any[]): IRouter;
    get(path: string, ...handlers: any[]): IRouter;
    post(path: string, ...handlers: any[]): IRouter;
    put(path: string, ...handlers: any[]): IRouter;
    patch(path: string, ...handlers: any[]): IRouter;
    delete(path: string, ...handlers: any[]): IRouter;
  }

  // Router is callable — returns an IRouter
  export function Router(): IRouter;

  interface Application extends IRouter {
    listen(port: number, hostname: string, callback?: () => void): any;
    listen(port: number, callback?: () => void): any;
  }

  function e(): Application;
  namespace e {
    export function Router(): IRouter;
    export function json(options?: any): any;
    export function raw(options?: any): any;
    export function urlencoded(options?: any): any;
  }

  export default e;
}

declare module 'cors' {
  const cors: (options?: any) => any;
  export default cors;
}

declare module 'helmet' {
  const helmet: (options?: any) => any;
  export default helmet;
}

declare module 'morgan' {
  const morgan: (format: string, options?: any) => any;
  export default morgan;
}

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string, options?: any): any;
  export function decode(token: string, options?: any): any;
}
