import { Constructor, IndexedTypeOf, FirstParameter } from './types'

declare global {
    namespace jest {
        interface Matchers<R> {
            toThrowErrorSatisfying(satisfies: (error: Error) => void): R;
            toThrowErrorOfTypeSatisfying<E>(errorType: Constructor<E>, satisfies: (error: E) => void): R;
        }
    }
}

type CustomMatcher = IndexedTypeOf<FirstParameter<typeof expect.extend>>
type MatcherContext = ThisType<CustomMatcher>

const toThrowErrorSatisfying = function (this: MatcherContext, throwingFn: () => void, satisfies: (error: Error) => void) {
    return toThrowErrorOfTypeSatisfyingInternal(this, throwingFn, undefined, satisfies)
}

const toThrowErrorOfTypeSatisfying = function <E extends Error>(this: MatcherContext, throwingFn: () => void, errorType: Constructor<E> | undefined, satisfies: (error: E) => void) {
    return toThrowErrorOfTypeSatisfyingInternal(this, throwingFn, errorType, satisfies)
}
function toThrowErrorOfTypeSatisfyingInternal<E extends Error>(_context: MatcherContext, throwingFn: () => void, errorType: Constructor<E> | undefined, satisfies: (error: E) => void) {

    let thrown: Error | undefined = undefined
    try {
        throwingFn()
    } catch (e) {
        thrown = e

        if (errorType && !(e instanceof errorType)) {
            return {
                pass: false,
                message: () => `expected error of type ${errorType.name} but caught ${(e as Object).constructor.name}`
            }
        }

        satisfies(e)
    }

    return {
        pass: !!thrown,
        message: () => thrown ? `expected to catch an exception to satisfy the given assertions, but caught ${thrown}` : 'Expected an eception to be thrown'
    }
}

expect.extend({
    toThrowErrorSatisfying,
    toThrowErrorOfTypeSatisfying
})

export function asMock<T>(t: T): jest.Mock<T> {
    return t as unknown as jest.Mock<T>
}

export function asMockFn<T extends (...args: any[]) => any>(t: T): jest.MockedFunction<T> {
    return t as unknown as jest.MockedFunction<T>
}