import { IndexedTypeOf, FilterOutKeysByPropType, RequiredKeys, OptionalKeys } from './util/types'
import { IndexQuery, ObjectArrayQuery, ObjectQuery, ObjectSubquery, Query, ConditionalValueQuery, PrimitiveType, PrimitiveArrayQuery, IndexAsArray, IndexedObjectQuery } from './queryTypes'

/** The result of query Q against type T */
export type QueryResult<T, Q extends Query<T>> = QueryResult_<T, Q, undefined>;

export type QueryResult_<T, Q extends Query<T>, IFFALSE> = QueryResult__<T, Q, IFFALSE>;
export type QueryResult__<T, Q, IFFALSE> =
    true extends Q ? T
    : false extends Q ? IFFALSE
    : Q extends ConditionalValueQuery<T> ? (T | undefined)
    : T extends (infer E)[] ? ArrayQueryResult<E, Q>
    : Q extends ObjectQuery<T> ? ObjectQueryResult_<T, Q>
    : never;

export type ArrayQueryResult<E, Q> =
    E extends PrimitiveType ? (Q extends PrimitiveArrayQuery<E> ? E[] : never)
    : Q extends ObjectArrayQuery<E> ? ObjectArrayQueryResult<E, Q>
    : never;

export type ObjectArrayQueryResult<E, Q extends ObjectArrayQuery<E>> = Array<QueryResult_<E, Q['$elementQuery'], undefined>>

export type ObjectQueryResult_<T, Q extends ObjectQuery<T>> = {
    0: ObjectQueryResult<T, Q>,
    1: never
}[Q extends any ? 0 : never];

export type ObjectQueryResult<T, Q extends ObjectQuery<T>> =
    Q extends IndexQuery<T> ? IndexedObjectQueryResult<T, Q>
    : Q extends ObjectSubquery<T> ? ObjectSubqueryResult<T, Q>
    : never;

export type IndexedObjectQueryResult<T, Q extends IndexQuery<T>> =
    Q extends IndexAsArray ? Array<IndexedValueResult<T, Q>>
    : {
        [key: string]: IndexedValueResult<T, Q>;
    };

type IndexedValueResult<T, Q extends IndexQuery<T>> =
    T extends PrimitiveType ? T
    : Q extends IndexedObjectQuery<T> ? QueryResult_<IndexedTypeOf<T>, Q['$indexedQuery'], never>
    : never;


export type ObjectSubqueryResult<T, Q extends ObjectSubquery<T>> =
    {
        [K in Extract<FilterOutKeysByPropType<Q, undefined>, RequiredKeys<T>>]: QueryResult_<T[K], Q[K], never>
    } & {
        [K in Extract<FilterOutKeysByPropType<Q, undefined>, OptionalKeys<T>>]?: QueryResult_<T[K], Q[K], never>
    };