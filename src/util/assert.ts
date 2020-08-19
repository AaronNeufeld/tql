export function assert(condition: boolean, detailMessage?: string): asserts condition {
    if (!condition) {
        assertNever(detailMessage)
    }
}

/** Assert that the given case should never be encountered. This function always throws an `Error`. */
export function assertNever<T>(detailMessage?: string): T {
    const unexpected = 'unexpected application state'
    throw new Error(detailMessage ? `${unexpected}: ${detailMessage}` : unexpected)
}