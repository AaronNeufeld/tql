import { IndexKey, Index, IndexTypeOf, IndexedTypeOf } from './types'

export type IterableTransform<T, R> = (iterable: Iterable<T>) => Iterable<R>
export type IterableItemPredicate<T> = (item: T, index: number) => boolean
export type IterableMapper<T, R> = (item: T, index: number) => R
export type IterableReducer<T, R> = (previousResult: R, currentItem: T, currentIndex: number) => R

export function iterableEvery<T>(iterable: Iterable<T>, predicate: IterableItemPredicate<T>): boolean {

    if (Array.isArray(iterable)) {
        return iterable.every(predicate)
    }

    let i = 0
    for (const item of iterable) {

        if (!predicate(item, i)) {
            return false
        }

        i++
    }

    return true
}

export function iterableSome<T>(iterable: Iterable<T>, predicate: IterableItemPredicate<T>): boolean {

    if (Array.isArray(iterable)) {
        return iterable.some(predicate)
    }

    let i = 0
    for (const item of iterable) {

        if (predicate(item, i)) {
            return true
        }

        i++
    }

    return false
}

export function iterableSingleMatch<T>(iterable: Iterable<T>, predicate: IterableItemPredicate<T>): boolean {

    let i = 0
    let found = false
    for (const item of iterable) {

        if (predicate(item, i)) {
            if (found) {
                return false // multiple matches
            }

            found = true
        }

        i++
    }

    return found // 0 or 1 match
}

export function iterableElementAt<T>(iterable: Iterable<T>, index: number): T | undefined {
    if (!Number.isInteger(index) || index < 0) {
        throw new Error('invalid index: ' + index)
    }

    if (Array.isArray(iterable)) {
        return iterable[index]
    }

    let i = 0
    for (const item of iterable) {
        if (i === index) {
            return item
        }

        i++
    }

    return undefined
}

export function* iterableFilter<T>(iterable: Iterable<T>, predicate: IterableItemPredicate<T>): Iterable<T> {

    let i = 0
    for (const entry of iterable) {
        if (predicate(entry, i)) {
            yield entry
        }

        i++
    }
}

export function iterableReduce<T, R>(iterable: Iterable<T>, reducer: IterableReducer<T, R>, initialValue: R): R {

    let i = 0
    let r = initialValue
    for (const entry of iterable) {
        r = reducer(r, entry, i)
        i++
    }

    return r
}

export class ItChain<T> {

    private constructor(private readonly iterable: Iterable<T>) {
    }

    static from<T>(iterable: Iterable<T>): ItChain<T> {
        return new ItChain(iterable)
    }

    /** Iterate keys of an object as strings. Uses `for (key in obj) { obj.hasOwnProperty(key) }`, so `symbol` keys are ignored. */
    static fromKeysOf<T extends {} = {}>(obj: T): ItChain<keyof T & string> {
        return ItChain.from(function* () {
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    continue
                }

                yield key
            }
        }())
    }

    /** Iterate values of an object. Uses `for (key in obj) { obj.hasOwnProperty(key) }`, so `symbol` keys are ignored. */
    static fromValuesOf<T extends {}>(obj: T): ItChain<IndexedTypeOf<T>> {
        return ItChain.from(function* () {
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    continue
                }

                yield obj[key] as IndexedTypeOf<T>
            }
        }())
    }

    /** Iterate entries of an object. Uses `for (key in obj) { obj.hasOwnProperty(key) }`, so `symbol` keys are ignored. */
    static fromEntriesOf<T extends {}>(obj: T): ItChain<[IndexTypeOf<T>, IndexedTypeOf<T>]> {
        return ItChain.from(function* () {
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    continue
                }

                yield [key as unknown as IndexTypeOf<T>, obj[key]] as [IndexTypeOf<T>, IndexedTypeOf<T>]
            }
        }())
    }

    transform<R>(transform: IterableTransform<T, R>): ItChain<R> {
        return new ItChain(transform(this.iterable))
    }

    map<R>(mappingFunction: IterableMapper<T, R>): ItChain<R> {
        return this.transform(function* (it) {
            let i = 0
            for (const item of it) {
                yield mappingFunction(item, i)
                i++
            }
        })
    }

    filter(predicate: IterableItemPredicate<T>): ItChain<T> {
        return this.transform(it => iterableFilter(it, predicate))
    }

    maybeFilter<X>(x: X, predicate: (x: NonNullable<X>, item: T, index: number) => boolean): ItChain<T> {

        return !!x ? this.filter(predicate.bind(undefined, x!)) : this
    }

    reduce<R>(reducer: IterableReducer<T, R>, initialValue: R): R {
        return iterableReduce(this.iterable, reducer, initialValue)
    }

    toIndex<K extends IndexKey, V>(keyFunction: (item: T) => K, valueFunction: (item: T) => V): Index<V, K> {
        return this.reduce((index, item) => {

            const key = keyFunction(item)

            if (key) {
                if (index[key]) {
                    throw new Error(`key already exists in index: ${key}`)
                }

                index[key] = valueFunction(item)
            }

            return index
        }, {} as any) as Index<V, K>
    }

    indexBy<K extends IndexKey>(keyFunction: (item: T) => K): Index<T, K> {
        return this.toIndex(keyFunction, t => t)
    }

    every(predicate: IterableItemPredicate<T>): boolean {
        return iterableEvery(this.iterable, predicate)
    }

    some(predicate: IterableItemPredicate<T>): boolean {
        return iterableSome(this.iterable, predicate)
    }

    singleMatch(predicate: IterableItemPredicate<T>): boolean {
        return iterableSingleMatch(this.iterable, predicate)
    }

    asArray(): T[] {
        return this.reduce((arr, item) => [...arr, item], [] as T[])
    }

    asIterable(): Iterable<T> {
        return this.map(x => x).iterable
    }
}