import { QueryResult } from './queryResultTypes'
import { assertSame } from './util/testing'

describe('Query<T>', () => {

    it('object: subquery all', () => {

        type A = {
            a: string,
            b: number
        }

        const query = {
            a: true,
            b: true
        }

        type Actual = QueryResult<A, typeof query>
        type Expected = A

        assertSame<Actual, Expected, {}>()
    })

    it('object: subquery some', () => {

        type A = {
            a: string,
            b: number
        }

        const query = {
            a: true
        }

        type Actual = QueryResult<A, typeof query>
        type Expected = Pick<A, 'a'>

        assertSame<Actual, Expected, {}>()
    })

    it('object: indexed, allProps()', () => {

        type A = {
            a: string,
            b: {
                [key: string]: {
                    c: number,
                    d: number
                }
            }
        }

        const query = {
            a: true,
            b: true
        }

        type Actual = QueryResult<A, typeof query>
        type Expected = A

        assertSame<Actual, Expected, {}>()
    })

    it('object: indexed, value type allProps()', () => {

        type A = {
            a: string,
            b: {
                [key: string]: {
                    c: number,
                    d: number
                }
            }
        }

        const query = {
            a: true,
            b: {
                indexedQuery: true
            }
        }

        type Actual = QueryResult<A, typeof query>
        type Expected = {
            a: string,
            b: {
                [key: string]: {
                    c: number,
                    d: number
                }
            }
        }

        assertSame<Actual, Expected, {}>()
    })

    it('array: allElements()', () => {

        type A = string[]

        const query = true

        type Actual = QueryResult<A, typeof query>
        type Expected = A

        assertSame<Actual, Expected, {}>()
    })
})