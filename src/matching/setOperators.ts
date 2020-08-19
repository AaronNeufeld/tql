import { KnownKeys } from '../util/types';
import { OperatorHandler } from './conditionMatching';
import { MatchContext } from './MatchContext';
import { resolveArrayOrRefs, negate, includesByDeepEqual } from './operatorHelpers';
import { ArrayOrRefs } from './FieldReference';

export type SetOperable = string | number | bigint | object
export type SetOperator<T extends SetOperable> =
    InOperator<T>
    | NotInOperator<T>;

export type InOperator<T extends SetOperable> = {
    /**
     * Test that the value is in the given list of values.
     * 
     * Equivalent to: `{ $or: [{ $eq: v1}, { $eq: v2}, ..., { $eq: vN}]}`
     */
    $in: ArrayOrRefs<T>
};
export type NotInOperator<T extends SetOperable> = {
    /**
     * Test that the value is not in the given list of values
     * 
     * Equivalent to: `{ $not: { $in: ... }}`
     */
    $nin: ArrayOrRefs<T>
};

export const setOperatorHandlers: {
    [K in KnownKeys<SetOperator<SetOperable>>]: OperatorHandler
} = {
    $in: <T, R>(
        matchContext: MatchContext<T, R>,
        arrayOrRefs: ArrayOrRefs<T>
    ) => includesByDeepEqual(resolveArrayOrRefs(arrayOrRefs, matchContext), matchContext.currentValue),

    $nin: negate(() => setOperatorHandlers.$in),
}