type Diff<T, U> = T extends U ? never : T;

type KeyDiff<A, B> = Diff<keyof A, keyof B>;
type ValDiffKey<A, B> = { [K in keyof A]: K extends keyof B ? A[K] extends B[K] ? B[K] extends A[K] ? never : K : K : never }[keyof A];

export type PropDiff<A, B> = {
    [P in KeyDiff<A, B> | KeyDiff<B, A> | ValDiffKey<A, B>]:
        P extends keyof A ?
            P extends keyof B ?
                { left: A[P], right: B[P] } :
                { left: A[P] } :
        P extends keyof B ?
            { right: B[P] } :
            never;
};


export function checkExtends<A, _B extends A>() {}
/** usage: `assertSame<T1, T2, {}>()` (do NOT provide 4th type argument!) */
export function assertSame<A extends B_, B extends A, _D extends PropDiff<A, B>, B_ = B>() {}