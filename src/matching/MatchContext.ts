import { ArrayTypeOf, CustomError, IfObject, IfArray, IndexKey, IfString } from '../util/types'
import { FieldReference } from './FieldReference'
import { splitFieldPath, joinFieldPath } from './FieldPath'
import { ObjectEntry, isObjectEntry } from './objectOperators'

export class MatchContext<T, R> {

    /** The root context, or `undefined` if this is the root context */
    readonly rootContext: MatchContext<R, R>

    private constructor(
        readonly currentValue: T,
        readonly currentPath: string[],
        // defined above because of `undefined` here
        rootContext: MatchContext<T, R>['rootContext'] | undefined,
        /** The parent context, or `undefined` if this is the root context */
        readonly parentContext: MatchContext<unknown, R> | undefined,
        /**
         * For sub-contexts of objects/arrays, this differentiates between a
         * value of undefined (i.e. `{ x: undefined }`) and a key/element not existing.
         * 
         * For other contexts, this is equivalent to `currentValue !== undefined`.
         */
        readonly currentFieldExists: boolean) {

        this.rootContext = rootContext || (this as unknown as MatchContext<R, R>)
    }

    static of<R>(rootValue: R): MatchContext<R, R> {
        return new MatchContext<R, R>(rootValue, [], undefined, undefined, rootValue !== undefined)
    }

    /** For object values only, derive a new context for a field of the current value */
    fieldContext<K extends IfObject<T, keyof T>>(field: K): IfObject<T, MatchContext<T[K], R>> {

        if (typeof field !== 'string' && typeof field !== 'number') {
            throw new MatchContextError('symbol fields are not supported', this)
        }

        if (typeof this.currentValue !== 'object') {
            throw new MatchContextError('cannot derive from a non-object context: ' + JSON.stringify(this.currentValue), this)
        }

        return this.subContext(
            this.currentValue[field],
            field,
            Object.prototype.hasOwnProperty.call(this.currentValue, field)) as any // cast because of conditional return type
    }

    /** For object values only, derive a new context for a path into the current value */
    fieldPathContext(fieldPath: IfObject<T, string>): IfObject<T, MatchContext<unknown, R>> {
        this.validateFieldPath(fieldPath)

        // this supports multi-level navigation, but current the type system does not (only known keys)
        return this.resolvePathParts(splitFieldPath(fieldPath)) as IfObject<T, MatchContext<unknown, R>> // cast because of conditional return type
    }

    /** For array values only, derive a new context for an element of the current value  */
    elementContext<I extends IfArray<T, number> | IfString<T, number>>(i: I): T extends any[] | string ? MatchContext<T[I], R> : never {
        if (!this.currentFieldExists) {
            return this.emptySubContext([i]) as any // cast because of conditional return type
        }

        if (!Array.isArray(this.currentValue)) {
            throw new MatchContextError('expected current to be array, but found: ' + JSON.stringify(this.currentValue), this)
        }

        const currentArray = this.currentValue as ArrayTypeOf<T>[]

        return this.subContext(this.currentValue[i], i, currentArray.length > i) as any // cast because of conditional return type
    }

    /** Derive an arbitrary context from this context. The current value must exist. */
    deriveContext<TNew>(newCurrent: TNew, path: string | number | string[]): MatchContext<TNew, R> {
        if (!this.currentFieldExists) {
            throw new MatchContextError('Cannot derive from a context of a field which does not exist', this)
        }

        return this.subContext(newCurrent, path, newCurrent !== undefined)
    }

    /** Resolve a field reference using this context */
    resolveFieldReference<F>(field: FieldReference<F>): F {
        if (typeof field.$field !== 'string') {
            throw new MatchContextError('invalid field path: ' + field.$field, this)
        }

        const { currentValue: current } = this.resolvePathStringWithPrefixes(field.$field)
        return current as F
    }

    /** Return the current path as a string */
    getPathString(): string {
        return joinFieldPath(this.currentPath)
    }

    private subContext<S>(
        newValue: S,
        additionalPathParts: undefined | string | number | string[],
        newFieldExists: boolean
    ): MatchContext<S, R> {

        return new MatchContext(
            newValue,
            additionalPathParts === undefined ? this.currentPath : this.subPath(additionalPathParts),
            this.rootContext,
            this,
            newFieldExists
        )
    }

    private subPath(additionalPathParts: string | number | string[]): string[] {
        if (typeof additionalPathParts === 'string') {
            return [...this.currentPath, additionalPathParts]
        } else if (typeof additionalPathParts === 'number') {
            return [...this.currentPath, additionalPathParts + '']
        } else {
            return [...this.currentPath, ...additionalPathParts]
        }
    }

    private emptySubContext([firstPathPart, ...nextPathParts]: (string | number)[]): MatchContext<undefined, R> {
        const nextEmptyContext = this.subContext(undefined, firstPathPart, false)

        if (nextPathParts.length === 0) {
            return nextEmptyContext
        } else {
            return nextEmptyContext.emptySubContext(nextPathParts)
        }
    }

    private validateFieldPath(fieldPath: string) {
        if (fieldPath[0] === '^' || fieldPath.startsWith('../')) {
            throw new MatchContextError('invalid field path: ' + fieldPath, this)
        }
    }

    private resolvePathStringWithPrefixes(path: string): MatchContext<unknown, R> {
        if (path[0] === '^') {
            return this.rootContext.resolvePathParts(splitFieldPath(path.substring(1)))
        } else if (path[0] === '.') {
            if (path[1] !== '.' || path[2] !== '/') {
                throw new MatchContextError(`invalid path: ${path}`, this)
            } else if (!this.parentContext) {
                throw new MatchContextError('cannot get parent of root context', this)
            }

            // call ...WithPrefixes() to support chained parent navigations
            return this.parentContext.resolvePathStringWithPrefixes(path.substring(3))
        } else {
            return this.resolvePathParts(splitFieldPath(path))
        }
    }

    private resolvePathParts(pathParts: string[]): MatchContext<unknown, R> {

        if (!this.currentFieldExists) {
            return this.emptySubContext(pathParts)
        } else if (typeof this.currentValue !== 'object') {
            throw new MatchContextError('cannot derive from a non-object context: ' + JSON.stringify(this.currentValue), this)
        }

        const [firstPathPart, ...nextPathParts] = pathParts

        const firstContext = this.subContext(
            (this.currentValue as any)[firstPathPart],
            firstPathPart,
            Object.prototype.hasOwnProperty.call(this.currentValue, firstPathPart))

        if (nextPathParts.length === 0) {
            return firstContext
        } else {
            return firstContext.resolvePathParts(nextPathParts)
        }
    }
}

export class MatchContextError extends CustomError {

    constructor(message: string, readonly matchContext: MatchContext<any, any>) {
        super(message)
    }
}

export function isStringMatchContext<R>(matchContext: MatchContext<unknown, R>): matchContext is MatchContext<string, R> {
    return typeof matchContext.currentValue === 'string'
}

export function isObjectMatchContext<R>(matchContext: MatchContext<unknown, R>): matchContext is MatchContext<object, R> {
    return typeof matchContext.currentValue === 'object'
}

export function isObjectEntryMatchContext<K extends IndexKey, V, R>(matchContext: MatchContext<unknown, R>): matchContext is MatchContext<ObjectEntry<K, V>, R> {
    return isObjectEntry(matchContext.currentValue)
}

export function isArrayMatchContext<R>(matchContext: MatchContext<unknown, R>): matchContext is MatchContext<any[], R> {
    return Array.isArray(matchContext.currentValue)
}