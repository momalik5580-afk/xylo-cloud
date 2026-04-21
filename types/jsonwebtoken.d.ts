declare module 'jsonwebtoken' {
  export interface SignOptions {
    algorithm?: string;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    keyid?: string;
    mutatePayload?: boolean;
  }

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: object
  ): object | string;

  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): null | { [key: string]: any } | string;
}