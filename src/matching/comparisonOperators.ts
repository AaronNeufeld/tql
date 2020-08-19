import { KnownKeys } from '../util/types';
import { OperatorHandler } from './conditionMatching';
import { MatchContext } from './MatchContext';
import { compareToCurrent, negate } from './operatorHelpers';
import { ValueOrRef } from './FieldReference';

export type Comparable = string | number | bigint
export type ComparisonOperator<T extends Comparable> =
    GreaterThanOperator<T>
    | GreaterThanOrEqualOperator<T>
    | LessThanOperator<T>
    | LessThanOrEqualOperator<T>;

export type GreaterThanOperator<T extends Comparable> = { $gt: ValueOrRef<T> };
export type GreaterThanOrEqualOperator<T extends Comparable> = { $gte: ValueOrRef<T> };
export type LessThanOperator<T extends Comparable> = { $lt: ValueOrRef<T> };
export type LessThanOrEqualOperator<T extends Comparable> = { $lte: ValueOrRef<T> };

export const comparisonOperatorHandlers: {
    [K in KnownKeys<ComparisonOperator<Comparable>>]: OperatorHandler
} = {
    $gt: <T, R>(
        matchContext: MatchContext<T, R>,
        valueOrRef: ValueOrRef<T>
    ) => compareToCurrent(matchContext, valueOrRef, (a, b) => a > b),

    $gte: negate(() => comparisonOperatorHandlers.$lt),

    $lt: <T, R>(
        matchContext: MatchContext<T, R>,
        valueOrRef: ValueOrRef<T>
    ) => compareToCurrent(matchContext, valueOrRef, (a, b) => a < b),

    $lte: negate(() => comparisonOperatorHandlers.$gt),
}