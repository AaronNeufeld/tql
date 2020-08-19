import { IndexedTypeOf, HasIndexSignature, IndexTypeOf, OptionalKeys, RequiredKeys } from "./types"
import { assertSame } from './testing'

describe('index signature types', () => {

    type A = {
        a: string,
        b: number
    }

    assertSame<never, IndexTypeOf<A>, {}>()
    assertSame<never, IndexedTypeOf<A>, {}>()
    assertSame<never, HasIndexSignature<A>, {}>()

    type B = {
        [key: string]: A
    }

    assertSame<string, IndexTypeOf<B>, {}>()
    assertSame<A, IndexedTypeOf<B>, {}>()
    assertSame<B, HasIndexSignature<B>, {}>()

    type C = {
        a: string,
        b: string,
        [key: string]: string
    }

    assertSame<string, IndexTypeOf<C>, {}>()
    assertSame<string, IndexedTypeOf<C>, {}>()
    assertSame<C, HasIndexSignature<C>, {}>()
})

describe('OptionalKeys + RequiredKeys', () => {

    it('all required => never', () => {
        type Sample = {
            a: string,
            b: string,
            c: string
        }

        type ActualOptional = OptionalKeys<Sample>
        type ExpectedOptional = never

        assertSame<ActualOptional, ExpectedOptional, {}>()

        type ActualRequired = RequiredKeys<Sample>
        type ExpectedRequired = keyof Sample

        assertSame<ActualRequired, ExpectedRequired, {}>()
    })

    it('some optional', () => {
        type Sample = {
            a: string,
            b?: string,
            c: string,
            d?: string
        }

        type ActualOptional = OptionalKeys<Sample>
        type ExpectedOptional = 'b' | 'd'

        assertSame<ActualOptional, ExpectedOptional, {}>()

        type ActualRequired = RequiredKeys<Sample>
        type ExpectedRequired = 'a' | 'c'

        assertSame<ActualRequired, ExpectedRequired, {}>()
    })

    it('all optional', () => {
        type Sample = {
            a?: string,
            b?: string,
            c?: string
        }

        type ActualOptional = OptionalKeys<Sample>
        type ExpectedOptional = 'a' | 'b' | 'c'

        assertSame<ActualOptional, ExpectedOptional, {}>()

        type ActualRequired = RequiredKeys<Sample>
        type ExpectedRequired = never

        assertSame<ActualRequired, ExpectedRequired, {}>()
    })

    it('required union with undefined', () => {
        type Sample = {
            a: string | undefined,
            b: string,
            c: string
        }

        type ActualOptional = OptionalKeys<Sample>
        type ExpectedOptional = never

        assertSame<ActualOptional, ExpectedOptional, {}>()

        type ActualRequired = RequiredKeys<Sample>
        type ExpectedRequired = 'a' | 'b' | 'c'

        assertSame<ActualRequired, ExpectedRequired, {}>()
    })

    it('required union with undefined, some optional', () => {
        type Sample = {
            a: string | undefined,
            b: string,
            c?: string
        }

        type ActualOptional = OptionalKeys<Sample>
        type ExpectedOptional = 'c'

        assertSame<ActualOptional, ExpectedOptional, {}>()

        type ActualRequired = RequiredKeys<Sample>
        type ExpectedRequired = 'a' | 'b'

        assertSame<ActualRequired, ExpectedRequired, {}>()
    })
})