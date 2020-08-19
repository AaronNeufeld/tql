import { MatchContext } from './MatchContext'
import { isField, ValueOrRef, ArrayOrRefs } from './FieldReference'
import { OperatorHandler } from './conditionMatching'
import { deepEqual } from '../util/deepEqual'

export function resolveValueOrRef<V, R>(valueOrRef: ValueOrRef<V>, matchContext: MatchContext<unknown, R>): V {
    return isField(valueOrRef) ? matchContext.resolveFieldReference(valueOrRef) : valueOrRef
}

export function resolveArrayOrRefs<E, R>(arrayOrRefs: ArrayOrRefs<E>, matchContext: MatchContext<unknown, R>): E[] {

    if (Array.isArray(arrayOrRefs)) {
        return arrayOrRefs.map(ref => resolveValueOrRef(ref, matchContext))
    } else if (isField(arrayOrRefs)) {
        const resolved = matchContext.resolveFieldReference(arrayOrRefs)

        if (resolved === undefined || resolved === null) {
            return []
        } else if (Array.isArray(resolved)) {
            return resolved
        } else {
            throw new Error('expected array, but found: ' + JSON.stringify(resolved))
        }
    } else {
        throw new Error('invalid array or reference: ' + JSON.stringify(arrayOrRefs))
    }
}

export function negate(getOperatorHandler: () => OperatorHandler): OperatorHandler {
    return (...args) => !getOperatorHandler().apply(undefined, args)
}

export function compareToCurrent<T, R>(matchContext: MatchContext<T, R>, compareTo: ValueOrRef<T>, comparisonFn: (a: NonNullable<T>, b: NonNullable<T>) => boolean): boolean {
    return compareValues(matchContext.currentValue, compareTo, matchContext, comparisonFn)
}
export function compareValues<T, R>(a: T, b: ValueOrRef<T>, matchContext: MatchContext<any, R>, comparisonFn: (a: NonNullable<T>, b: NonNullable<T>) => boolean): boolean {

    const comparingValue = a as T | undefined | null

    if (comparingValue === undefined || comparingValue === null) {
        return false
    }

    const compareToValue = resolveValueOrRef(b, matchContext)

    if (compareToValue === undefined || compareToValue === null) {
        return false
    }

    if (typeof comparingValue !== typeof compareToValue) {
        return false
    }

    return comparisonFn(comparingValue as NonNullable<T>, compareToValue as NonNullable<T>)
}

export function includesByDeepEqual<E>(array: E[], valueToFind: E): boolean {

    return array.some(a => deepEqual(a, valueToFind))
}