import { isExactMatch } from "./conditionMatching"

describe('isExactMatch', () => {

    it('true expression', () => {


        const value = { a: 4, b: 5, c: 6, _1234: 4 } as { [key: string]: number }

        const isMatch = isExactMatch(value, { $indexAsArray: { $someMatch: { $key: { $length: 5 }, $value: 4 } } })

        expect(isMatch).toBe(true)
    })

    it('false expression', () => {

        const value = { a: 4, b: 5, c: 6, _1234: 4 } as { [key: string]: number }

        const isMatch = isExactMatch(value, { $indexEntries: { a: 4, $w: { $exists: false } } })
        const isMatch2 = isExactMatch(value, { $eq: { a: 4 } })
        const isMatch3 = isExactMatch(value, { $eq: value })

        expect(isMatch).toBe(true)
        expect(isMatch2).toBe(false)
        expect(isMatch3).toBe(true)
    })
})
