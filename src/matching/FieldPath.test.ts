import { splitFieldPath, FieldPathError, joinFieldPath } from "./FieldPath"
require('../util/jestExtensions')

describe('splitFieldPath', () => {

    it('throws error on empty path', () => {

        const path = ''

        expectSplitFieldPathToThrow(path, ['empty path', -1])
    })

    it('throws error on empty quoted path', () => {

        const path = "''"

        expectSplitFieldPathToThrow(path, ['zero length name', 1])
    })

    // dot errors

    it('throws error on only dot path', () => {

        const path = "."

        expectSplitFieldPathToThrow(path, ['zero length name', 0])
    })

    it('throws error on dot-prefixed path', () => {

        const path = ".abc"

        expectSplitFieldPathToThrow(path, ['zero length name', 0])
    })

    it('throws error on double dot path', () => {

        const path = ".."

        expectSplitFieldPathToThrow(path, ['zero length name', 0])
    })

    it('throws error on double dot-prefixed path', () => {

        const path = "..abc.d"

        expectSplitFieldPathToThrow(path, ['zero length name', 0])
    })

    it('throws error on double dot mid-path', () => {

        const path = "abc..d"

        expectSplitFieldPathToThrow(path, ['zero length name', 4])
    })


    it('throws error on dot at end of path', () => {

        const path = "abc.d."

        expectSplitFieldPathToThrow(path, ['cannot end with a dot', 5])
    })

    // basic paths

    it('returns single-element array for single char name', () => {

        const path = 'y'
        const expected = [path]

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('returns single-element array for simple name', () => {

        const path = 'abcdefg'
        const expected = [path]

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('returns single-element array for name with non-quote characters', () => {

        const path = '!@#$%^&*()[]{}|?/<>,`~'
        const expected = [path]

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('returns two element array for simple two-part path', () => {

        const path = 'a.b'
        const expected = ['a', 'b']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('returns two element array for simple two-part path', () => {

        const path = 'abc.def.ghi.jkl.mno.pqr.stu.vwx.yz'
        const expected = path.split('.')

        expect(splitFieldPath(path)).toEqual(expected)
    })

    // basic quoted names

    it('supports quoted name with dot', () => {

        const path = '"a.b"'
        const expected = ['a.b']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports multi-part path with dot inside quotes', () => {

        const path = '"a.b".c'
        const expected = ['a.b', 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports multi-part path with dot inside quotes', () => {

        const path = 'x."a.b".c'
        const expected = ['x', 'a.b', 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    // quoting errors

    it('throws error on char before open quote', () => {

        const path = "abc.d'e'"

        expectSplitFieldPathToThrow(path, ["unquoted/unescaped ' char (or, char before opening quote char)", 5])
    })

    it('throws error on char after close quote', () => {

        const path = "abc.'d'e"

        expectSplitFieldPathToThrow(path, ['character(s) after closing quote char (or unescaped quote char in quotes)', 7])
    })

    it('throws error on unclosed quote', () => {

        const path = "abc.'de"

        expectSplitFieldPathToThrow(path, ['unclosed quote', 4])
    })

    // escape char

    it('supports escaping the escape character inside quotes - middle', () => {

        const path = '"a\\\\b".c'
        const expected = ['a\\b', 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports escaping the single quote inside quotes - start', () => {

        const path = "'\\'ab'.c"
        const expected = ["'ab", 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports escaping the double quote inside quotes - end', () => {

        const path = '"xyz\\"".c'
        const expected = ['xyz"', 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports escaping the double quote inside single quotes - end', () => {

        const path = '\'xyz\\"\'.c'
        const expected = ['xyz"', 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    it('supports escaping the single quote inside double quotes - middle', () => {

        const path = '"x\\\'yz".c'
        const expected = ["x'yz", 'c']

        expect(splitFieldPath(path)).toEqual(expected)
    })

    // escape char errors

    it('throws error on escape char outside quotes', () => {

        const path = "abc.\\de"

        expectSplitFieldPathToThrow(path, ['escape character found outside quotes', 4])
    })

    it('throws error on escaping non-quote or escape char', () => {

        const path = "abc.'\\de'"

        expectSplitFieldPathToThrow(path, ["only ', \" and \\ chars can be escaped, found: \\d", 5])
    })
})

function expectSplitFieldPathToThrow(path: string, [errorDetailMessage, errorPosition]: [string, number]) {
    expect(() => splitFieldPath(path)).toThrowErrorOfTypeSatisfying(FieldPathError, error => {
        expect(error.detailMessage).toEqual(errorDetailMessage)
        expect(error.position).toEqual(errorPosition)
        expect(error.path).toEqual(path)
    })
}

describe('joinFieldPath', () => {

    it('throws on non-array', () => {

        const pathParts = 2 as unknown as string[]

        expect(() => joinFieldPath(pathParts)).toThrowErrorOfTypeSatisfying(FieldPathError, error => {
            expect(error.detailMessage).toEqual('expected pathParts to be an array, given: ' + pathParts)
            expect(error.position).toEqual(-1)
            expect(error.path).toEqual('')
        })
    })

    it('return empty string on empty array', () => {

        const pathParts: string[] = []
        const expected = ''

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('returns simple, single-part path', () => {

        const pathParts = ['abc']
        const expected = pathParts[0]

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('joins simple, two-part path', () => {

        const pathParts = ['abc', 'def']
        const expected = pathParts.join('.')

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('joins multi-part path', () => {

        const pathParts = ['abc', 'def', '@awe', '854*$*']
        const expected = pathParts.join('.')

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('quotes and escapes single quotes - start', () => {

        const pathParts = ['abc', "'def"]
        const expected = 'abc."\\\'def"'

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('quotes and escapes double quotes - end', () => {

        const pathParts = ['abc', 'def"']
        const expected = 'abc."def\\""'

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('quotes and escapes the escape char - middle', () => {

        const pathParts = ['abc', 'def\\ghi']
        const expected = 'abc."def\\\\ghi"'

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })

    it('quotes and escapes multiple quote/esc chars', () => {

        const pathParts = ['abc', 'def"it\\or\'']
        const expected = 'abc."def\\"it\\\\or\\\'"'

        expect(joinFieldPath(pathParts)).toEqual(expected)
    })
})
