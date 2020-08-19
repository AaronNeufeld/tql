import { CustomError } from '../util/types'
import { assert } from '../util/assert'

const ESC = '\\'
const ESC_REGEX = /['"\\]/g
const ESC_REPLACEMENT = ESC + '$&'

export function splitFieldPath(path: string): string[] {
    if (path.length === 0) {
        throw new FieldPathError('empty path', path, -1)
    }

    const pathParts = new Array<string>()

    // building the current name
    let currentName = ''
    // index of recent '.'
    let lastDelimiter = -1
    // indicate if the current name is quoted, and with which quote
    let inQuotes: '"' | "'" | false = false
    // for current name, indicate index of opening quote, or false if not quoted
    let openQuote: number | false = false
    // for current name, indicate index of closing quote, or false if not seen/quoted
    let closeQuote: number | false = false
    for (let i = 0; i < path.length; i++) {
        const c = path[i];

        if (c === '"' || c === "'") {
            if (inQuotes === c) {
                // closing quote
                closeQuote = i
                inQuotes = false

                if (i + 1 < path.length && path[i + 1] !== '.') {
                    // example: a."b"c.d ('c' is after the closing quote)
                    throw new FieldPathError('character(s) after closing quote char (or unescaped quote char in quotes)', path, closeQuote + 1)
                }

                continue // do not output current character

            } else if (!inQuotes) {
                // opening quote

                if (lastDelimiter !== i - 1) {
                    // example: a.b"c".d (opening quote doesn't come after a dot)
                    throw new FieldPathError(`unquoted/unescaped ${c} char (or, char before opening quote char)`, path, i)
                }

                inQuotes = c
                openQuote = i
                continue // do not output current character
            }
        } else if (c === ESC) {
            if (!inQuotes) {
                throw new FieldPathError('escape character found outside quotes', path, i)
            }

            i++ // skip the escape character (output next char instead)

            if (!['"', "'", ESC].includes(path[i])) {
                throw new FieldPathError(`only ', " and ${ESC} chars can be escaped, found: ${ESC}${path[i]}`, path, i - 1)
            }

            // intentional fall-through to output character...
        } else if (c === '.' && !inQuotes) {

            capturePathPart()

            // setup for next name:
            lastDelimiter = i
            currentName = ''
            openQuote = false
            closeQuote = false
            continue // do not output current character
        }

        // output current character (re-index path in case `i` has changed (i.e. escape character))
        currentName += path[i]
    }

    if (inQuotes) {
        assert(openQuote !== false, 'inQuotes but openQuote is false')

        throw new FieldPathError('unclosed quote', path, openQuote)
    } else if (lastDelimiter === path.length - 1) {
        throw new FieldPathError('cannot end with a dot', path, path.length - 1)
    }

    // capture the final path part
    capturePathPart()

    return pathParts

    function capturePathPart() {
        if (currentName.length === 0) {
            throw new FieldPathError('zero length name', path, (openQuote === false? lastDelimiter : openQuote) + 1)
        }

        pathParts.push(currentName)
    }
}

export function joinFieldPath(pathParts: string[]): string {

    if (!Array.isArray(pathParts)) {
        throw new FieldPathError('expected pathParts to be an array, given: ' + pathParts, '', -1)
    }

    return pathParts
        .map(name => {
            const replaced = name.replace(ESC_REGEX, ESC_REPLACEMENT)

            return name === replaced ? name : `"${replaced}"`
        })
        .join('.')
}

export class FieldPathError extends CustomError {

    constructor(readonly detailMessage: string, readonly path: string, readonly position: number) {
        super(FieldPathError.createMessage(detailMessage, path, position))
    }

    private static createMessage(detailMessage: string, path: string, position: number): string {
        return `invalid path: ${detailMessage}\n\tat position ${position} of: ${path}`
    }
}