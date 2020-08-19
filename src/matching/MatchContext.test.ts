import { MatchContext, MatchContextError } from "./MatchContext"
import { FieldReference } from './FieldReference'
import * as FieldPath from './FieldPath'
const joinFieldPathMock = jest.spyOn(FieldPath, 'joinFieldPath')
const splitFieldPathMock = jest.spyOn(FieldPath, 'splitFieldPath')
require('../util/jestExtensions')


describe('MatchContext.rootContext', () => {

    it('result is the expected root context', () => {
        // arrange
        const rootValue = { a: 2, b: 'test' }

        // act
        const matchContext = MatchContext.of(rootValue)

        // assert
        checkMatchContext(matchContext)
        expect(matchContext.currentValue).toBe(rootValue)
        expect(matchContext.currentPath).toHaveLength(0)
        expect(matchContext.currentFieldExists).toBe(true)
    })
})

describe('MatchContext.fieldContext', () => {

    it('throws on symbol field', () => {
        // arrange
        const sampleSymbol = Symbol('sample')
        const rootValue = { [sampleSymbol]: 2, x: '' }
        const matchContext = MatchContext.of(rootValue)

        // act/assert
        expect(() => matchContext.fieldContext(sampleSymbol))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual('symbol fields are not supported')
            })
    })

    it('throws on non-object current value', () => {
        // arrange
        const rootValue = '2534'
        const matchContext = MatchContext.of(rootValue)

        // act/assert
        expect(() => (matchContext as MatchContext<any, any>).fieldContext('x.y.z'))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual(`cannot derive from a non-object context: "${rootValue}"`)
            })
    })

    it('returns expected sub context for a field which exists', () => {
        // arrange
        const rootValue = { x: [1, 2, 3], y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)

        // act
        const result: MatchContext<number, typeof rootValue> = matchContext.fieldContext('y')

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(rootValue.y)
        expect(result.currentPath).toEqual(['y'])
        expect(result.currentFieldExists).toBe(true)
    })

    it('returns empty sub context for field which does not exist', () => {
        // arrange
        const rootValue = { x: [1, 2, 3], y: 3, z: 0 }
        const matchContext = MatchContext.of<typeof rootValue & { a?: any }>(rootValue)

        // act
        const result = matchContext.fieldContext('a')

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBeUndefined()
        expect(result.currentPath).toEqual(['a'])
        expect(result.currentFieldExists).toBe(false)
    })
})

describe('MatchContext.fieldPathContext', () => {

    it('throws on path with absolute prefix', () => {
        // arrange
        const rootValue = { x: 2, y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)
        const absoluatePath = '^x'

        // act/assert
        expect(() => matchContext.fieldPathContext(absoluatePath))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual('invalid field path: ' + absoluatePath)
            })
    })

    it('throws on path with parent nav prefix', () => {
        // arrange
        const rootValue = { x: 2, y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)
        const parentNavPath = '../x'

        // act/assert
        expect(() => matchContext.fieldPathContext(parentNavPath))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual('invalid field path: ' + parentNavPath)
            })
    })

    it('throws on non-object current value', () => {
        // arrange
        const rootValue = '2534'
        const matchContext = MatchContext.of(rootValue)

        // act/assert
        expect(() => (matchContext as MatchContext<any, any>).fieldPathContext('x.y.z'))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual(`cannot derive from a non-object context: "${rootValue}"`)
            })
    })

    it('returns expected sub context on valid simple path for a field which exists', () => {
        // arrange
        const rootValue = { x: [1, 2, 3], y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.fieldPathContext('x')

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(rootValue.x)
        expect(result.currentPath).toEqual(['x'])
        expect(result.currentFieldExists).toBe(true)
    })

    it('returns expected sub context on valid multi-part path for fields which exist', () => {
        // arrange
        const rootValue = { x: [1, 2, 3], y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.fieldPathContext('x.1')

        // assert
        checkMatchContext(result, matchContext.fieldContext('x'))
        expect(result.currentValue).toBe(rootValue.x[1])
        expect(result.currentPath).toEqual(['x', '1'])
        expect(result.currentFieldExists).toBe(true)
    })

    it('returns empty sub context on path for field which does not exist', () => {
        // arrange
        const rootValue = { x: [1, 2, 3], y: 3, z: 0 }
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.fieldPathContext('a.b')

        // assert
        checkMatchContext(result, matchContext.fieldPathContext('a'))
        expect(result.currentValue).toBeUndefined()
        expect(result.currentPath).toEqual(['a', 'b'])
        expect(result.currentFieldExists).toBe(false)
    })
})

describe('MatchContext.elementContext', () => {

    it('throws on non-array current value', () => {
        // arrange
        const rootValue = { a: 2 }
        const matchContext = MatchContext.of(rootValue)

        // act/assert
        expect(() => (matchContext as MatchContext<any, any>).elementContext(1))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {

                expect(error.matchContext).toBe(matchContext)
                expect(error.message).toEqual(`expected current to be array, but found: {"a":2}`)
            })
    })

    it('returns expected sub context on element which exists', () => {
        // arrange
        const rootValue = [1, 2, 3]
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.elementContext(2)

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(rootValue[2])
        expect(result.currentPath).toEqual(['2'])
        expect(result.currentFieldExists).toBe(true)
    })

    it('returns empty sub context on non-existant current value', () => {
        // arrange
        const rootValue: string[] = undefined as any
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.elementContext(5)

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(undefined)
        expect(result.currentPath).toEqual(['5'])
        expect(result.currentFieldExists).toBe(false)
    })

    it('returns empty sub context on element which does not exist', () => {
        // arrange
        const rootValue = [1, 2, 3]
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.elementContext(5)

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(rootValue[5])
        expect(result.currentPath).toEqual(['5'])
        expect(result.currentFieldExists).toBe(false)
    })

    it('handles tuple return type', () => {
        // arrange
        const rootValue: [string, number, boolean] = ['one', 2, true]
        const matchContext = MatchContext.of(rootValue)

        // act
        const result: MatchContext<boolean | undefined, typeof rootValue> = matchContext.elementContext(2)

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toBe(rootValue[2])
        expect(result.currentPath).toEqual(['2'])
        expect(result.currentFieldExists).toBe(true)
    })
})

describe('MatchContext.deriveContext', () => {

    it('throws if current field does not exist', () => {
        // arrange
        const matchContext = MatchContext.of(undefined)

        // act/assert
        expect(() => matchContext.deriveContext(2, 2))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {
                expect(error.message).toEqual('Cannot derive from a context of a field which does not exist')
                expect(error.matchContext).toBe(matchContext)
            })
    })

    it('returns expected sub-context when current field exists', () => {
        // arrange
        const rootValue = 'testing'
        const matchContext = MatchContext.of(rootValue)

        // act
        const result = matchContext.deriveContext(rootValue.length, 'length')

        // assert
        checkMatchContext(result, matchContext)
        expect(result.currentValue).toEqual(rootValue.length)
        expect(result.currentPath).toEqual(['length'])
        expect(result.currentFieldExists).toBe(true)
    })
})

describe('MatchContext.resolveFieldReference', () => {

    it('throws on non-string argument', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)

        // act/assert
        expect(() => matchContext.resolveFieldReference({ $field: undefined as any }))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {
                expect(error.message).toEqual('invalid field path: undefined')
                expect(error.matchContext).toBe(matchContext)
            })
    })

    it('throws on single dot prefix', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const fieldPath = '.test'

        // act/assert
        expect(() => matchContext.resolveFieldReference({ $field: fieldPath }))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {
                expect(error.message).toEqual('invalid path: ' + fieldPath)
                expect(error.matchContext).toBe(matchContext)
            })
    })

    it('throws on double dot prefix (without slash)', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const fieldPath = '..test'

        // act/assert
        expect(() => matchContext.resolveFieldReference({ $field: fieldPath }))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {
                expect(error.message).toEqual('invalid path: ' + fieldPath)
                expect(error.matchContext).toBe(matchContext)
            })
    })

    it('throws on parent nav beyond root', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const fieldPath = '../test'

        // act/assert
        expect(() => matchContext.resolveFieldReference({ $field: fieldPath }))
            .toThrowErrorOfTypeSatisfying(MatchContextError, error => {
                expect(error.message).toEqual('cannot get parent of root context')
                expect(error.matchContext).toBe(matchContext)
            })
    })

    it('resolves absolute path from root context', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const fieldRef: FieldReference<string> = { $field: '^b.c' }

        // act
        const result = matchContext.resolveFieldReference(fieldRef)

        // assert
        expect(result).toEqual(rootValue.b.c)
        expect(splitFieldPathMock).toBeCalledWith('b.c')
    })

    it('resolves absolute path from sub context', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const subContext = matchContext.fieldContext('a')
        const fieldRef: FieldReference<number[]> = { $field: '^b.d' }

        // act
        const result = subContext.resolveFieldReference(fieldRef)

        // assert
        expect(result).toEqual(rootValue.b.d)
        expect(splitFieldPathMock).toBeCalledWith('b.d')
    })

    it('resolves path with parent nav from sub context', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const subContext = matchContext.fieldContext('a')
        const fieldRef: FieldReference<number[]> = { $field: '../b.d' }

        // act
        const result = subContext.resolveFieldReference(fieldRef)

        // assert
        expect(result).toEqual(rootValue.b.d)
        expect(splitFieldPathMock).toBeCalledWith('b.d')
    })

    it('resolves path with chained parent nav from sub context', () => {
        // arrange
        const rootValue = { a: 2, b: { c: 'c', d: [1, 2, 3] } }
        const matchContext = MatchContext.of(rootValue)
        const subContext = matchContext.fieldContext('b').fieldContext('d')
        const fieldRef: FieldReference<string> = { $field: '../../a' }

        // act
        const result = subContext.resolveFieldReference(fieldRef)

        // assert
        expect(result).toEqual(rootValue.a)
        expect(splitFieldPathMock).toBeCalledWith('a')
    })
})

describe('MatchContext.getPathString', () => {

    it('calls joinFieldPath()', () => {
        // arrange
        const mockPathString = {} as string
        joinFieldPathMock.mockReturnValue(mockPathString)

        const matchContext = MatchContext.of({ a: 1 }).fieldContext('a')

        // act
        const result = matchContext.getPathString()

        // assert
        expect(result).toBe(mockPathString)
        expect(joinFieldPathMock).toBeCalledWith(matchContext.currentPath)
    })
})


function checkMatchContext(matchContext: MatchContext<unknown, unknown>, expectedParent?: MatchContext<unknown, unknown>) {

    expect(matchContext).toBeDefined()
    expect(matchContext.rootContext).toBeDefined()

    expect(matchContext.rootContext === matchContext).toEqual(expectedParent === undefined)

    if (expectedParent) {
        expect(matchContext.parentContext).toEqual(expectedParent)
    }
}