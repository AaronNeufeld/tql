import { KnownKeys } from '../util/types';
import { LogicalOperator } from './logicalOperators';
import { ComparisonOperator, Comparable } from './comparisonOperators';
import { EqualityOperator, Equatable } from './equalityOperators';
import { SetOperator, SetOperable } from './setOperators';
import { ObjectEntryOperator, IndexedObjectOperator, ExistsOperator } from './objectOperators';
import { TypeOperator } from './typeOperator';
import { ArrayOperator } from './arrayOperators';
import { StringOperator } from './stringOperators';

export type AllOperators =
    LogicalOperator<any>
    | ExistsOperator
    | TypeOperator
    | IndexedObjectOperator<any>
    | ObjectEntryOperator<any, any>
    | EqualityOperator<Equatable>
    | ComparisonOperator<Comparable>
    | SetOperator<SetOperable>
    | ArrayOperator<any>
    | StringOperator;

export type AllOperatorKeys = KnownKeys<AllOperators>;
export function isOperatorKey(key: string): key is AllOperatorKeys {
    return key[0] === '$'
}