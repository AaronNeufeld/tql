/**
 * A reference to a value in an object. See `$field` for syntax.
 */
export type FieldReference<T> = {
    /**
     * A field reference can be relative to either
     * the object root (absolute) or the current location (relative).
     * 
     * An absolute reference begins with `^`.
     * A relative reference begins with a name, or `..` representing the parent node.
     * 
     * Arrays can be indexed using `someArray.i`, where `i` is some number.
     */
    $field: string,
    __fieldType?: T
}

export type ValueOrRef<T> = FieldReference<T> | T;
export type ArrayOrRefs<T> = FieldReference<T[]> | ValueOrRef<T>[]


export function field<T>(fieldPath: string): FieldReference<T> {
    return {
        $field: fieldPath
    }
}

export function isField<T>(field: ValueOrRef<T>): field is FieldReference<T>;
export function isField<T>(field: any): field is FieldReference<T>;
export function isField<T>(field: ValueOrRef<T> | any): field is FieldReference<T> {
    return !!(field as FieldReference<T>).$field
}