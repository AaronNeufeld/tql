import { ConditionExpressionOrImplicitEq, ConditionExpression } from './conditionTypes';
import { ArrayOrRefs } from './FieldReference'
import { KnownKeys, ArrayTypeOf, isIterable } from '../util/types';
import { assertNever } from '../util/assert';
import { OperatorHandler, isExactMatchInternal } from './conditionMatching';
import { MatchContext, isArrayMatchContext } from './MatchContext';
import { resolveArrayOrRefs, negate } from './operatorHelpers';
import { deepEqual } from '../util/deepEqual';
import { isObjectEntry } from './objectOperators';
import { iterableEvery, iterableSome, iterableSingleMatch, iterableElementAt } from '../util/iterable';

export type ArrayOperator<EContains, EMatch = EContains> =
    ArrayContainsOperator<EContains>
    | ArrayMatchOperator<EMatch>
    | ElementAtOperator<EMatch>
    | ArraySizeOperator;

export type IterableArrayOperator<EContains, EMatch = EContains> =
    ArrayContainsOperator<EContains>
    | ArrayMatchOperator<EMatch>
    | ArraySizeOperator;

export type ArrayContainsOperator<EContains> =
    ContainsAllOperator<EContains>
    | ContainsSameOperator<EContains>
    | ContainsSomeOperator<EContains>
    | ContainsNoneOperator<EContains>;

export type ArrayMatchOperator<EMatch> =
    AllMatchOperator<EMatch>
    | SomeMatchOperator<EMatch>
    | SingleMatchOperator<EMatch>
    | NoneMatchOperator<EMatch>;

export type ArrayOperatorIterationTarget<EContains, EMatch = EContains> = {
    $forContains: () => Iterable<EContains>,
    $forMatch: () => Iterable<EMatch>,
    $size: () => number
};
function isArrayOperatorIterationTarget<EContains, EMatch = EContains>(target: any): target is ArrayOperatorIterationTarget<EContains, EMatch> {

    const maybe = target as ArrayOperatorIterationTarget<EContains, EMatch>

    return !!maybe.$forContains && !!maybe.$forMatch && !!maybe.$size
}
function getArrayOperatorIterationTarget<E, T, R>(
    matchContext: MatchContext<T, R>,
    getIterableFromTarget: (target: ArrayOperatorIterationTarget<E>) => () => Iterable<E>
): Iterable<E> | false {
    const targetIterable: T | Iterable<E> = isArrayOperatorIterationTarget<E>(matchContext.currentValue)
        ? getIterableFromTarget(matchContext.currentValue)() // get iterable (i.e. from generator)
        : matchContext.currentValue

    if (!isIterable<E>(targetIterable)) {
        if (targetIterable === undefined || targetIterable === null) {
            return false
        }

        throw new Error('non-iterable target: ' + targetIterable)
    }

    return targetIterable
}

export type ContainsAllOperator<EContains> = {
    /**
     * Test that the array (or index) contains all of the given values at least once (non-exclusive)
     * 
     * Elements are compared using the $eq operator.
     * 
     * See also:
     * $eq (exact deep match, same order)
     * $containsSame (same elements deep match, any order)
     * $containsSome
     */
    $containsAll: ArrayOrRefs<EContains>
};
export type ContainsSameOperator<EContains> = {
    /**
     * Test that the array (or index) contains the exact same elements (including duplicates) as the given array, in any order.
     * 
     * For order-sensitive equality, see $eq.
     * 
     * Elements are compared using the $eq operator.
     * 
     * See also:
     * $eq (exact deep match, same order)
     * $containsAll
     */
    $containsSame: ArrayOrRefs<EContains>
};
export type ContainsSomeOperator<EContains> = {
    /**
     * Test that the array (or index) contains at least one of the given values
     * 
     * See also:
     * $containsNone
     * $containsAll
     */
    $containsSome: ArrayOrRefs<EContains>
};
export type ContainsNoneOperator<EContains> = {
    /**
     * Test that the array (or index) does not contain any of the given values
     * 
     * Equivalent to { $not: { $containsSome: [...] } }
     * 
     * See also:
     * $containsSome
     * $containsAll
     */
    $containsNone: ArrayOrRefs<EContains>
};

export type AllMatchOperator<EMatch> = {
    /**
     * Test that all elements of the array (or entries of index) match the given condition
     */
    $allMatch: ConditionExpressionOrImplicitEq<EMatch>
};
export type SomeMatchOperator<EMatch> = {
    /**
     * Test that at least one element of the array (or entry of index) matches the given condition
     */
    $someMatch: ConditionExpressionOrImplicitEq<EMatch>
};
export type SingleMatchOperator<EMatch> = {
    /**
     * Test that exactly one element of the array (or entry of index) matches the given condition
     * 
     * Note that this will always check every element. If possible, use $someMatch instead
     * to short-circuit the iteration.
     * 
     * See also:
     * $someMatch
     * $allMatch
     * $noneMatch
     */
    $singleMatch: ConditionExpressionOrImplicitEq<EMatch>
};
export type NoneMatchOperator<EMatch> = {
    /**
     * Test that no elements of the array (or entries of index) match the given condition
     * 
     * Equivalent to: `{ $not: { $someMatch: [...] } }`
     */
    $noneMatch: ConditionExpressionOrImplicitEq<EMatch>
};
export type ElementAtOperator<EMatch> = {
    /**
     * Test that the element at the given index matches the given condition.
     * 
     * Value is a tuple: `[index: number, condition: ConditionExpression<E>]`
     */
    $elementAt: [number, ConditionExpression<EMatch>]
};
export type ArraySizeOperator = {
    /**
     * Test that the size of the array matches the given condtion (or value, same as using $eq operator)
     */
    $size: ConditionExpressionOrImplicitEq<number>
};


export const arrayOperatorHandlers: {
    [K in KnownKeys<ArrayOperator<any>>]: OperatorHandler
} = {

    $containsAll: <T, R>(
        matchContext: MatchContext<T, R>,
        arrayOrRefs: ContainsAllOperator<ArrayTypeOf<T>>['$containsAll']
    ) => {

        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forContains)
        if (!current) {
            return false
        }

        const operandArray = resolveArrayOrRefs(arrayOrRefs, matchContext)
        const matches: boolean[] = new Array<boolean>(operandArray.length).fill(false)
        for (const entry of current) {
            const i = operandArray.findIndex(r => deepEqual(r, entry))

            if (i !== -1) {
                matches[i] = true
            }
        }

        return matches.every(isMatched => isMatched)
    },

    $containsSame: <T, R>(
        matchContext: MatchContext<T, R>,
        arrayOrRefs: ContainsSameOperator<ArrayTypeOf<T>>['$containsSame']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forContains)
        if (!current) {
            return false
        }

        const operandArray = resolveArrayOrRefs(arrayOrRefs, matchContext)

        if (Array.isArray(current) && current.length !== operandArray.length) {
            return false
        }

        // keep track of which elements in the operand array are matched, to ensure we handle duplicates correctly
        const matches: boolean[] = new Array(operandArray.length).fill(false)

        // keep track of how many entries we've seen in the current array/index
        let entryCount = 0
        for (const entry of current) {
            entryCount++
            // if there are more entries than elements in the operand, we know $containsSame has failed
            if (entryCount > operandArray.length) {
                return false
            }

            // find matching element in operand
            const matchIndex = operandArray.findIndex((operandValue, i) => /* don't test same value twice: */ !matches[i] && deepEqual(entry, operandValue))

            // if match not found, we know $containsSame has failed
            if (matchIndex === -1) {
                return false
            }

            // record the match
            matches[matchIndex] = true
        }

        // ensure there were enough entries -- if there were, that means they all had matches, since we do not test the same operand value twice
        return entryCount === operandArray.length
    },

    $containsSome: <T, R>(
        matchContext: MatchContext<T, R>,
        arrayOrRefs: ContainsSomeOperator<ArrayTypeOf<T>>['$containsSome']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forContains)
        if (!current) {
            return false
        }

        const operandArray = resolveArrayOrRefs(arrayOrRefs, matchContext)

        return iterableSome(current, entry => operandArray.some(operandValue => deepEqual(operandValue, entry)))
    },

    // TODO: does negation correctly take into account a non-iterable current value? (see first `return false` in $containsSome)
    $containsNone: negate(() => arrayOperatorHandlers.$containsSome),


    $allMatch: <T, R>(
        matchContext: MatchContext<T, R>,
        elementCondition: AllMatchOperator<ArrayTypeOf<T>>['$allMatch']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forMatch)
        if (!current) {
            return false
        }

        return iterableEvery(current, (entry, i) => isExactMatchInternal(getSubContext(matchContext, entry, i), elementCondition))
    },
    $someMatch: <T, R>(
        matchContext: MatchContext<T, R>,
        elementCondition: SomeMatchOperator<ArrayTypeOf<T>>['$someMatch']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forMatch)
        if (!current) {
            return false
        }

        return iterableSome(current, (entry, i) => isExactMatchInternal(getSubContext(matchContext, entry, i), elementCondition))
    },
    $singleMatch: <T, R>(
        matchContext: MatchContext<T, R>,
        elementCondition: SingleMatchOperator<ArrayTypeOf<T>>['$singleMatch']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forMatch)
        if (!current) {
            return false
        }

        return iterableSingleMatch(current, (entry, i) => isExactMatchInternal(getSubContext(matchContext, entry, i), elementCondition))
    },
    $noneMatch: negate(() => arrayOperatorHandlers.$someMatch),

    $elementAt: <T, R>(
        matchContext: MatchContext<T, R>,
        elementAtCondition: ElementAtOperator<ArrayTypeOf<T>>['$elementAt']
    ) => {
        const current = getArrayOperatorIterationTarget<ArrayTypeOf<T>, T, R>(matchContext, t => t.$forMatch)
        if (!current) {
            return false
        }

        const [index, elementCondition] = elementAtCondition

        const element = iterableElementAt(current, index)

        return !!element && isExactMatchInternal(getSubContext(matchContext, element, index), elementCondition)
    },

    $size: <T, R>(
        matchContext: MatchContext<T, R>,
        sizeCondition: ArraySizeOperator['$size']
    ) => {
        if (Array.isArray(matchContext.currentValue)) {
            return isExactMatchInternal(matchContext.deriveContext(matchContext.currentValue.length, 'length'), sizeCondition)
        }

        if (isArrayOperatorIterationTarget(matchContext.currentValue)) {
            return isExactMatchInternal(matchContext.deriveContext(matchContext.currentValue.$size(), '$size'), sizeCondition)
        }

        if (matchContext.currentValue === undefined || matchContext.currentValue === null) {
            return false
        } else {
            throw new Error('non-iterable target: ' + matchContext.currentValue)
        }
    }
}

function getSubContext<T, R>(matchContext: MatchContext<T, R>, entry: ArrayTypeOf<T>, entryIndex: number): MatchContext<unknown, R> {
    return isObjectEntry(entry) ? matchContext.deriveContext(entry, entry.$key)
        : isArrayMatchContext(matchContext) ? matchContext.elementContext(entryIndex)
            : assertNever()
}