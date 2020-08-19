import { HasIndexSignature, IndexedTypeOf, IndexTypeOf } from './util/types'
import { ConditionExpression } from './matching/conditionTypes'
import { ObjectEntry } from './matching/objectOperators'

export type Query<T> = ValueQuery<T> | (
    T extends Array<infer E> ? ArrayQuery<E>
    : T extends {} ? ObjectQuery<T>
    : never
);

export type PrimitiveType = string | number | boolean | bigint;

export type ValueQuery<T> = boolean | ConditionalValueQuery<T>;

export type ConditionalValueQuery<T> = {
    $includeIf: ConditionExpression<T>
};

export function isValueQuery<T>(q: any): q is ValueQuery<T> {
    return typeof q === 'boolean' || !!(q as ConditionalValueQuery<T>).$includeIf
}


export type ObjectQuery<T> =
    T extends HasIndexSignature<T> ? IndexQuery<T>
    : ObjectSubquery<T>;

export function isObjectQuery<T>(t: T, q: any): q is ObjectQuery<T> {
    return isIndexQuery(q) || isObjectSubquery(t, q)
}

export type IndexQuery<T> =
    (IndexedTypeOf<T> extends PrimitiveType ? IndexedPrimitiveQuery<T>
        : IndexedObjectQuery<T>
    ) & IndexAsArrayQuery;

export function isIndexQuery<T>(q: any): q is IndexQuery<T> {
    return isIndexedObjectQuery<T>(q) || !!(q as IndexQuery<any>).$filter
}

type ObjectEntryFilter<T> = ConditionExpression<ObjectEntry<IndexTypeOf<T>, IndexedTypeOf<T>>>;

export type IndexedPrimitiveQuery<T> = {
    $filter: ObjectEntryFilter<T>
};

export type IndexedObjectQuery<T> = {
    $filter?: ObjectEntryFilter<T>,
    $indexedQuery: Query<IndexedTypeOf<T>>
};

export function isIndexedObjectQuery<T>(q: any): q is IndexedObjectQuery<T> {
    return !!(q as IndexedObjectQuery<any>).$indexedQuery
}

export type IndexAsArrayQuery = {
    $asArray?: true
};
export type IndexAsArray = Required<IndexAsArrayQuery>;
export function isIndexAsArray(q: any): q is IndexAsArray {
    return !!(q as IndexAsArrayQuery).$asArray
}

export type ObjectSubquery<T> = {
    [P in keyof T]?: Query<T[P]>
};

export function isObjectSubquery<T>(_t: T, _q: any): _q is ObjectSubquery<T> {
    return true
}

export type ArrayQuery<E> = E extends PrimitiveType ? PrimitiveArrayQuery<E> : ObjectArrayQuery<E>;

export type ObjectArrayQuery<E> = {
    $filter?: ConditionExpression<E>,
    $elementQuery: Query<E>
};

export type PrimitiveArrayQuery<E extends PrimitiveType> = {
    $filter: ConditionExpression<E>
};

export function isObjectArrayQuery<E>(q: any): q is ObjectArrayQuery<E> {
    return !!(q as ObjectArrayQuery<E>).$elementQuery
}

export function isArrayQuery<E>(q: any): q is ArrayQuery<E> {
    return isObjectArrayQuery<E>(q) || !!(q as ArrayQuery<E>).$filter
}