/////////////////////////////////
// Mapped types

/**
 * Type-safe version of built-in @see Omit type
 */
export type OmitProps<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Return a list (union) of keys from T for which the property is of type U
 */
export type FilterOutKeysByPropType<T, U> = {
    [P in keyof T]: T[P] extends U ? never : P
}[keyof T]

/** Get a union of keys (strings) which are defined on the object (ignoring index signatures) */
// for some reason this includes `undefined` in the union...
export type KnownKeys<T> = Exclude<KnownKeysInternal<T>, undefined>;
export type KnownKeysInternal<T> = {
    [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U } ? U : never;
/** T, if T has any @see KnownKeys */
export type HasKnownKeys<T> = KnownKeys<T> extends never ? never : T;

// for some reason this includes `undefined` in the union...
export type OptionalKeys<T> = Exclude<OptionalKeysInternal<T>, undefined>;
type OptionalKeysInternal<T> = {
    [K in keyof T]: T[K] extends Required<T>[K] ? never : K
}[keyof T];

export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

/** Union of types of all properties of T (including index signatures and known keys) */
export type AllPropertyTypes<T extends {}> = unknown extends AllPropertyTypesInternal<T> ? never : AllPropertyTypesInternal<T>;
type AllPropertyTypesInternal<T extends {}> =
    T extends { [key: string]: infer V } ? V
    : T extends { [index: number]: infer V } ? V
    : never;
/** Get the key type of the index signature of T */
export type IndexTypeOf<T> = string extends keyof T ? string : number extends keyof T ? number : never;
/** Get the value type of the index signature of T */
// export type IndexedTypeOf<T> =
//     T extends {} ? AllPropertyTypes<OmitProps<T, KnownKeys<T>>>
//     : never;
export type IndexedTypeOf<T> = T extends {} ? (HasKnownKeys<T> extends T ? AllPropertyTypes<OmitProps<T, KnownKeys<T>>> : AllPropertyTypes<T>) : never;
/** T, if T has an index signature (always true for `Array<E>`/`E[]`) */
export type HasIndexSignature<T extends {}> = IndexedTypeOf<T> extends never ? never : T

export type IndexKey = string | number;
/** A map of objects, indexed by a string or numeric value */
export type Index<T, K extends IndexKey> =
    number extends K ? {
        [key: number]: T;
    } : {
        [key: string]: T;
    }

export type ArrayTypeOf<T> = T extends (infer E)[] ? E : never

type AllPropertyTypesSimple<T extends {}> = T[keyof T];
type Tuplize<T extends {}[]> = Pick<T, Exclude<keyof T, Extract<keyof {}[], string> | number>>;
type _OneOf<T extends {}> = AllPropertyTypesSimple<{
    [K in keyof T]: T[K] & {
        [M in AllPropertyTypesSimple<{ [L in keyof Omit<T, K>]: keyof T[L] }>]?: undefined
    }
}>;
export type OneOf<T extends {}[]> = _OneOf<Tuplize<T>>;

export function isIterable<T>(obj: any): obj is Iterable<T> {
    return Array.isArray(obj) || typeof obj[Symbol.iterator] === 'function'
}

export type Constructor<T> = new (...args: any[]) => T

export type FirstParameter<T extends (...args: any) => any> = T extends (arg0: infer P, ...args: any) => any ? P : never;

/** If `T` is an object, but not an array, this is type `THEN` */
export type IfObject<T, THEN> =
    T extends string ? never
    : T extends number ? never
    : T extends bigint ? never
    : T extends boolean ? never
    : T extends Function ? never
    : T extends symbol ? never
    : T extends any[] ? never
    : T extends {} ? THEN
    : never;

export type IfArray<T, THEN> =
    T extends any[] ? THEN : never;

export type IfString<T, THEN> =
    T extends string ? THEN : never;

/**
 * Extend this instead of `Error` for correct prototyping and `instanceof` support 
 * 
 * See: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
 */
export class CustomError extends Error {

    constructor(message?: string) {
        const trueProto = new.target.prototype
        super(message)
        Object.setPrototypeOf(this, trueProto)
    }
}