import { ValueOrRef } from './FieldReference';
import { KnownKeys } from '../util/types';
import { OperatorHandler } from './conditionMatching';
import { MatchContext } from './MatchContext';
import { deepEqual } from '../util/deepEqual';
import { resolveValueOrRef, negate } from './operatorHelpers';

export type Equatable = string | number | bigint | object | boolean
export type EqualityOperator<T extends Equatable> =
    EqualOperator<T>
    | NotEqualOperator<T>;

export type EqualOperator<T extends Equatable> = {
    /**
     * Test that the value is equal to the given value.
     * 
     * For objects and arrays, this performs deep equality checking.
     * For objects, entry order is ignored (since it is not deterministic).
     */
    $eq: ValueOrRef<T>
};
export function isEqualOperator<T extends Equatable>(condition: any): condition is EqualOperator<T> {
    return !!condition.$eq
}
export type NotEqualOperator<T extends Equatable> = {
    /**
     * Test that the value is not equal to the given value.
     * 
     * For objects and arrays, this performs deep equality checking.
     */
    $ne: ValueOrRef<T>
};


export const equalityOperatorHandlers: {
    [K in KnownKeys<EqualityOperator<Equatable>>]: OperatorHandler
} = {
    $eq: <T, R>(
        matchContext: MatchContext<T, R>,
        valueOrRef: ValueOrRef<T>
    ) => deepEqual(matchContext.currentValue, resolveValueOrRef(valueOrRef, matchContext)),

    $ne: negate(() => equalityOperatorHandlers.$eq),
}