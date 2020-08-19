import { executeQuery } from './queryExecution'
import { QueryResult } from './queryResultTypes'

describe('executeQuery', () => {

    it('primitive value query: true', () => {

        const input = 2
        const query = true
        const expected = input

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('primitive value query: conditional', () => {

        const input: number = 2
        const query = { $includeIf: { $lt: 10 } }
        const expected = input

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('array: true', () => {

        const input = [1, 2, 3]
        const query = true
        const expected = input

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('array query: filter on value', () => {

        const input = [1, 2, 3]
        const query = { $filter: { $gte: 2 } }
        const expected = [2, 3]

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('array query: element query on object', () => {

        const input = [
            { x: 'x', y: 'y', z: 'z' },
            { x: '1', y: '2', z: '3' },
            { x: 'a', y: 'b', z: 'c' }
        ]
        const query = {
            $elementQuery: {
                x: true,
                y: true
            }
        }

        const expected: QueryResult<typeof input, typeof query> = [
            { x: 'x', y: 'y' },
            { x: '1', y: '2' },
            { x: 'a', y: 'b' }
        ]

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('array query: element query on object with optional properties', () => {

        type SampleType = {
            x: string
            y: string
            z?: string
        }

        const input: SampleType[] = [
            { x: 'x', y: 'y', z: 'z' },
            { x: '1', y: '2' },
            { x: 'a', y: 'b' }
        ]
        const query = {
            $elementQuery: {
                y: true,
                z: true
            }
        }

        const expected: QueryResult<SampleType[], typeof query> = [
            { y: 'y', z: 'z' },
            { y: '2' },
            { y: 'b' }
        ]

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object: true', () => {

        const input = {
            a: 2,
            b: 'test'
        }
        const query = true
        const expected = input

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object subquery: all', () => {

        const input = {
            a: 2,
            b: 'test'
        }
        const query = {
            a: true,
            b: true
        }
        const expected = input

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object subquery: partial', () => {

        const input = {
            a: 2,
            b: 'test'
        }
        const query = {
            a: true
        }

        const expected = {
            a: 2
        }

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object subquery: conditional, partial', () => {

        const input = {
            a: 2,
            b: 'test'
        }
        const query = {
            $includeIf: { a: { $gt: 1 } },
            a: true
        }

        const expected = {
            a: 2
        }

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object index query with subquery: partial', () => {

        type Input = {
            [key: string]: {
                a: number
                b: string
            }
        }

        const input: Input = {
            '123': { a: 2, b: 'test' },
            '456': { a: 54, b: 'ggggg' }
        }
        const query = {
            $indexedQuery: {
                b: true
            }
        }

        const expected = {
            '123': { b: 'test' },
            '456': { b: 'ggggg' }
        }

        expect(executeQuery(input, query)).toEqual(expected)
    })

    it('object index query with primitive', () => {

        type Input = {
            [key: string]: number
        }

        const input: Input = {
            'ax': 2,
            'axe': 3
        }
        const query = {
            $filter: { $key: { $length: 3 } }
        }

        const expected = {
            'axe': 3
        }

        expect(executeQuery(input, query)).toEqual(expected)
    })
})
