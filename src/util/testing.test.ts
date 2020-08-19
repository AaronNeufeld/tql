import { PropDiff, checkExtends, assertSame } from "./testing";

describe('PropDiff', () => {

    it('should return a type which explains property differences', () => {
        type Actual = PropDiff<
            { a: 1, b: 2, c: 1, d: 1 },
            { a: number, b: {}, c: 1, e: 1 }>;
        type Expected = {
            a: { left: 1, right: number },
            b: { left: 2, right: {} },
            d: { left: 1 },
            e: { right: 1 }
        };
        checkExtends<Expected, Actual>();
        checkExtends<Actual, Expected>();
        assertSame<Actual, Expected, Expected, {}>()
    })
})