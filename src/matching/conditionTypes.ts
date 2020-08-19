import { HasIndexSignature, OneOf, HasKnownKeys } from '../util/types';
import { LogicalOperator } from './logicalOperators';
import { EqualityOperator } from './equalityOperators';
import { ArrayOperator, IterableArrayOperator } from './arrayOperators';
import { ObjectEntryOperator, IndexedObjectOperator, ExistsOperator, ObjectEntry } from './objectOperators';
import { StringOperator } from './stringOperators';
import { ComparisonOperator } from './comparisonOperators';
import { SetOperator } from './setOperators';
import { TypeOperator } from './typeOperator';
import { ValueOrRef } from './FieldReference';

////////////////////////////////////
// Condition expressions

export type BasicConditionExpression<T> =
    ArrayConditionExpression<T>
    | StringConditionExpression<T>
    | NumberConditionExpression<T>
    | BooleanConditionExpression<T>
    | ObjectConditionExpression<T>
    | IndexedObjectConditionExpression<T>
    | ObjectEntriesConditionExpression<T>
    | ObjectEntryConditionExpression<T>;

export type BasicConditionExpressionOrLogicalOp<T> =
    LogicalOperator<T>
    | BasicConditionExpression<T>;

export type ConditionExpression<T> = T extends Function | undefined | symbol ? never
    : T extends string | number | bigint | boolean ? OneOf<[
        TypeConditionExpression<T>,
        BasicConditionExpressionOrLogicalOp<T>
    ]>
    : BasicConditionExpressionOrLogicalOp<T>;

export type ConditionExpressionOrImplicitEq<T> = ConditionExpression<T> | ValueOrRef<T>;

export type ArrayConditionExpression<A> =
    A extends Array<infer E> ? (
        E extends ObjectEntry<any, any> ? never
        : EqualityOperator<A> | ArrayOperator<E>
    )
    : never;

export type ObjectConditionExpression<T> =
    T extends object ? (
        T extends any[] ? never
        : T extends ObjectEntryOperator<any, any> ? never
        : (
            EqualityOperator<T> | ObjectFieldsConditionExpression<T>
        )
    ) : never;

export type ObjectFieldsConditionExpression<T extends {}> = T extends HasKnownKeys<T> ? {
    [K in keyof T]?: ObjectFieldConditionExpression<T[K]>
} : never;

export type ObjectFieldConditionExpression<V> = ConditionExpressionOrImplicitEq<V> | ExistsOperator

export type IndexedObjectConditionExpression<T> =
    T extends object ?
    T extends any[] ? never : (
        T extends HasIndexSignature<T> ? IndexedObjectOperator<T>
        : never
    ) : never;

export type ObjectEntriesConditionExpression<T> =
    T extends Array<ObjectEntry<infer K, infer V>> ? IterableArrayOperator<V, ObjectEntryOperator<K, V>>
    : never;

export type ObjectEntryConditionExpression<T> =
    T extends ObjectEntry<infer K, infer V> ? ObjectEntryOperator<K, V>
    : never;

export type StringConditionExpression<T> =
    T extends string
    ? StringOperator
    | ComparisonOperator<string>
    | EqualityOperator<string>
    | SetOperator<string>
    : never;

export type NumberConditionExpression<N> =
    N extends number | bigint
    ? ComparisonOperator<N>
    | EqualityOperator<N>
    | SetOperator<N>
    : never;

export type BooleanConditionExpression<T> = T extends boolean ? EqualityOperator<boolean> : never;

export type TypeConditionExpression<T> = T extends string | number | bigint | boolean ? TypeOperator : never;