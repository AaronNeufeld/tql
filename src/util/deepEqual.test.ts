import { deepEqual } from "./deepEqual"

describe('deepEqual', () => {

    it('compares same object (by ref) correctly', () => {

        const a = { a: 2 }
        const b = a
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares values of different type', () => {

        const a = { a: 2 }
        const b = 2
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares same strings correctly', () => {

        const a = '208vasdcas;djf'
        const b = '208vasdcas;djf'
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different strings correctly', () => {

        const a = '208vasdcas;djf'
        const b = 'not the same'
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares same numbers correctly', () => {

        const a = 6345.3234
        const b = 6345.3234
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different numbers correctly', () => {

        const a = -242321
        const b = 5.4
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares same booleans correctly', () => {

        const a = true
        const b = true
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different booleans correctly', () => {

        const a = false
        const b = true
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares two undefined args correctly', () => {

        const a = undefined
        const b = undefined
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares one undefined arg correctly', () => {

        const a = undefined
        const b = '432423'
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares two nulls correctly', () => {

        const a = null
        const b = null
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares one null correctly', () => {

        const a = { x: 2, y: 2 }
        const b = null
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares same arrays correctly (by value)', () => {

        const a = ['a', 'b', 'c']
        const b = ['a', 'b', 'c']
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares two empty arrays correctly', () => {

        const a = [] as any
        const b = [] as any
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different arrays correctly (different length)', () => {

        const a = ['a', 'b', 'c']
        const b = ['a', 'b', 'c', 'd']
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares different arrays correctly (different order)', () => {

        const a = ['a', 'b', 'c']
        const b = ['a', 'c', 'b']
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares different arrays correctly (different types)', () => {

        const a = [1, 2, 3, 4]
        const b = ['1', '2', '3', '4']
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares array and non-array correctly (array first)', () => {

        const a = [1, 2, 3, 4]
        const b = { a: [1, 2, 3, 4] }
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares array and non-array correctly (array second)', () => {

        const a = { a: [1, 2, 3, 4] }
        const b = [1, 2, 3, 4]
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares same objects correctly (same key order)', () => {

        const a = { a: [1, 2, 3, 4], 1: 1 }
        const b = { a: [1, 2, 3, 4], 1: 1 }
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares same objects correctly (different key order)', () => {

        const a = { a: [1, 2, 3, 4], 1: 1 }
        const b = { 1: 1, a: [1, 2, 3, 4] }
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different objects correctly (string vs. number key => equal)', () => {

        const a = { a: [1, 2, 3, 4], 1: 1 }
        const b = { a: [1, 2, 3, 4], '1': 1 }
        expect(deepEqual(a, b)).toBe(true)
    })

    it('compares different objects correctly (same # of keys)', () => {

        const a = { a: [1, 2, 3, 4], 1: 1, aa: 1234 }
        const b = { x: 3, y: true, z: undefined }
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares different objects correctly (different # of keys)', () => {

        const a = { a: [1, 2, 3, 4], 1: 1 }
        const b = { x: 3, y: true, z: undefined }
        expect(deepEqual(a, b)).toBe(false)
    })

    it('compares different objects correctly (difference at deeper level)', () => {

        const a = { a: [1, 2, 3, 4], b: { c: { d: 'test' } } }
        const b = { a: [1, 2, 3, 4], b: { c: { d: 'test2' } } }
        expect(deepEqual(a, b)).toBe(false)
    })
})
