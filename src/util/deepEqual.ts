
/**
 * Recursively test the equality of two values.
 * 
 * For objects, `Objects.keys()` is used to retrieve enumerable keys.
 * Note that object key order is not taken into account, since it
 * is not deterministic.
 * 
 * TODO: memoize deepEqual? where/when/what scope?
 * 
 * @param a 
 * @param b 
 * @returns true iff `a` is exactly the same as `b`, by value
 */
// alternative: https://github.com/inspect-js/node-deep-equal
export function deepEqual(a: unknown, b: unknown): boolean {

    if (a === b) {
        return true
    } else if (typeof a !== typeof b) {
        return false
    }

    switch (typeof a) {
        case 'string':
        case 'number':
        case 'bigint':
        case 'boolean':
            return false // first === comparison above covers true case
        case 'object':
            if (a === null || b === null) {
                return false // first === comparison above covers true case
            } else if (Array.isArray(a)) {
                return Array.isArray(b) && arrayDeepEqual(a, b)
            } else {
                return !Array.isArray(b) && objectDeepEqual(a, b as object)
            }
    }

    return false
}

function arrayDeepEqual(a: unknown[], b: unknown[]): boolean {

    if (a.length !== b.length) {
        return false
    }

    return a.every((aI, i) => deepEqual(aI, b[i]))
}

function objectDeepEqual<A extends NonNullable<object>, B extends NonNullable<object>>(a: A, b: B): boolean {
    const aKeys = Object.keys(a) as (keyof A)[]
    const bKeys = Object.keys(b) as (keyof B)[]

    if (aKeys.length !== bKeys.length) {
        return false
    }

    aKeys.sort()
    bKeys.sort()

    return aKeys.every((aKeyI, i) => deepEqual(aKeyI, bKeys[i]) && deepEqual(a[aKeyI], b[bKeys[i]]))
}