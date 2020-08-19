import { ConditionExpression } from "./conditionTypes"
import { field } from './FieldReference'

describe('primitive value conditions', () => {

    it('string', () => {

        const value = 'test'

        testCondition(value, { $in: ['4', '2'], $contains: 't2' })
        testCondition(value, { $length: field<number>('other.field') })
    })

    it('number', () => {

        const value = 5

        testCondition(value, { $gte: 3, $lte: 10 })
        testCondition(value, { $nin: [field<number>('someField'), 5, 4] })
    })

    it('boolean', () => {

        const value = true

        testCondition(value, { $eq: false })
        testCondition(value, { $ne: field<boolean>('isActive') })
    })
})

describe('array conditions', () => {

    it('number array', () => {

        const value = [1, 2, 3]

        testCondition(value, {
            $and: [
                { $containsSome: [1, 2, 4] },
                { $not: { $someMatch: { $gt: 3, $eq: 5 } } }
            ]
        })
    })

    it('string array', () => {

        const value = ['a', 'c']

        testCondition(value, {
            $someMatch: {
                $type: ['number', { $eq: 2, $gt: 2 }]
            },
            $noneMatch: {
                $length: 2
            }
        })
    })

    it('string-number union array', () => {

        const value = ['a', 'c', 9, 4, true]

        testCondition(value, {
            $someMatch: {
                $type: 'number'
            },
            $noneMatch: {
                $length: 2,
                $gt: '3'
            },
        })

        testCondition(value, {
            $someMatch: {
                $type: ['number', { $eq: 2, $gt: 2 }]
            },
            $noneMatch: {
                $length: 2,
                $gt: '3'
            },
        })
    })

    it('object array', () => {

        const value: { a: string, b: number }[] = [
            { a: 'a', b: 4 },
            { a: 'x', b: 193 }
        ]

        testCondition(value, { $someMatch: { $or: [{ a: '4' }, { b: { $gt: 45 } }] } })
    })

    it('array eq', () => {
        const value = { a: [1, 2, 3] }

        testCondition(value, { a: [1, 2, 3] })
        testCondition(value, { a: { $eq: [1, 2, 3] } })
    })
})

describe('indexed object conditions', () => {

    it('as array', () => {

        const value = { a: 4, b: 5, c: 6 } as { [key: string]: number }

        testCondition(value, { $indexAsArray: { $someMatch: { $key: { $length: 5 }, $value: 4 }, $or: [{ $allMatch: { $value: 4 } }, { $size: 3 }] } })
        testCondition(value, { $indexAsArray: { $containsAll: [2, 4, field<number>('')] } })
    })

    it('eq', () => {

        const value = { a: 4, b: 5, c: 6 } as { [key: string]: number }

        testCondition(value, { $eq: { a: 2 } })
    })

    it('entry matching', () => {

        const value = { a: 4, b: 5, c: 6 } as { [key: string]: number }

        testCondition(value, { $indexEntries: { a: { $exists: true }, b: 5, $eq: { $lt: 3 } } })
    })
})

describe('object field conditions', () => {

    it('exists', () => {

        const value = { a: 'a' } as { a: string, b?: number }

        testCondition(value, { b: { $exists: true } })
    })

    it('literal equals', () => {

        const value = { a: 'xy', b: 45, c: { d: false } }

        testCondition(value, { a: 'ss', c: { d: true } })
        testCondition(value, { a: 'ss', c: { $eq: { d: true } } })
    })
})



function testCondition<T>(t: T, condition: ConditionExpression<T>) {
    return t && condition
}