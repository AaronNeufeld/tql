# TQL: Matching

TQL includes rich support for value and object matching/filtering using condition expressions similar to MongoDB. These condition expressions support deep recursion and complex object types.

## Types

### Primitives

TQL supports the primitive value types `string`, `number`, `bigint`, `boolean` and `undefined`. Note that `Symbol` type is not supported, as it is not serializable nor comparable.

### Objects & Arrays

Objects and arrays can be matched either as a single value (i.e. full object equality), or by matching select fields/elements. For complex matching on arrays, see Array Operators below. For selective field matching within objects, simply add a field in the query object and provide a condition expression. See Expression Structure below for more details.

## Expression Structure

The general condition expression structure is:

`{ <$operator>: <operand> }`

As a shorthand, multiple operators can be specified side-by-side, and will be implicitly combined using the `$and` operator. Therefore:

`{ <$operator1>: <operand1>, <$operator2>: <operand2>, ..., <$operatorN>: <operandN> }`

is equivalent to:

`{ $and: [{ <$operator1>: <operand1> }, { <$operator2>: <operand2> }, ..., { <$operatorN>: <operandN> }] }`

For objects, sub-expressions can be provided for known fields, or arbitrary keys in the case of indexed objects:

`{ <field>: { <$operator>: <operand>, ... } }`

Note that for field sub-expressions, if the field does not exist on the target object, the sub-expression will not be evaluated and the expression will return false by default, unless the field is expected to not exist (see the `$exists` operator below).

## Expression Types

The type of the expression is determined by the type of the field being matched. Many operators can only be used within expressions of certain types.

### Union Types

Union types are supported, however a simple `typeof` check is used first when comparing values. For example, the `$gt` operator supports both `numbers` and `strings`, but an argument of type `string` will never match for a target of type `number`, regardless of whether the argument is a numeric string.

## Field References

A field reference is a pointer to another value/object within the same object being tested. Field references can be used anywhere a value is expected, and look similar to other operators:

`{ $field: <path> }`

For example:

`{ <field>: { $eq: { $field: 'otherField' } } }`

Field reference paths can be either relative or absolute. Absolute paths
are prefixed with `'^'`, indicating the root object. For example:

`{ <field>: { $eq: { $field: '^a.b.c' } } }`

Relative paths may start with `'../'` (zero or more times) to navigate up to the parent object, and otherwise simply start with a field name. For example:

`{ <field>: { $eq: { $field: '../b.c' } } }`

`{ <field>: { $eq: { $field: 'c.d' } } }`

## Operators

Note: all operators use "deep equality" (recursive) unless otherwise speicified.

### Logical Operators

Logical operators modify or combine multiple conditional expressions, and can be used as part of a conditional expression of any type.

* `$and`: matches all of the given expressions
* `$or`: matches at least one of the given expressions
* `$nor`: matches none of the given expressions
* `$not`: does not match the given expression

### Equality Operators

Equality operators accept a single argument: a value or field reference.

* `$eq` ("equal"): matches if the value and given operand are equal, recursively for arrays/objects (deep equality)
* `$ne` ("not equal"): inverse of `$eq`

### Comparison Operators

Comparison operators can be used on strings and numbers, and all accept a single argument: a value or field reference.

* `$gt`: greater than (`>`)
* `$gte`: greater than or equal (`>=`)
* `$lt`: less than (`<`)
* `$lte`: less than or equal (`<=`)

### Set Operators

Set operators can be used on strings, numbers, objects and arrays and accept a single argument: an array of values and field references.

* `$in`: matches at least one element in the set
* `$nin` ("not in"): does not match any element in the set

### Array Operators

All array operators can be applied to arrays and most can be applied to indexed objects (exceptions noted). They accept various arguments, as specified below.

* `$size`: matches if the size (length) of the array matches the given expression

Containment operators accept a single argument: an array of value or field references.

* `$containsAll`: matches if the array contains all the elements in the given array argument
* `$containsSame`: matches if the array contains exactly the same elements as the given array argument, in any order
* `$containsSome`: matches if the array contains at least one of the elements in the given array argument
* `$containsNone`: matches if the array does not contain any of the elements in the given array argument

Element matching operators accept a single argument: a condition expression which is matched against elements of the array.

* `$allMatch`: matches if all the elements of the array match the given condition expression
* `$someMatch`: matches if _at least one_ element in the array matches the given condition expression
* `$singleMatch`: matches if _exactly one_ element in the array matches the given condition expression
* `$noneMatch`: matches if no element in the array matches the given condition expression

The "selective element matching" operator is unique in that it selects a specific element of the array to match. Note that this operator cannot be applied to indexed objects, as the order of an indexed object is not deterministic.

* `$elementAt`: matches if the selected element exists _and_ matches the given condition expression. The single argument is a tuple containing the index to check and the condition expression: `[number, ConditionExpression<E>]` (where `E` is the element type of the array).

### String Operators

Unless otherwise specified, string operators accept a single argument: string or field reference

* `$eqi` ("case insensitive equal"): matches if the lowercase versions of the string and the given argument are equal.
* `$contains`: matches if the string contains the given argument
* `$startsWith`: matches if the given argument occurs at the beginning of the string
* `$endsWith`: matches if the given argument occurs at the end of the string
* `$regexp`: matches if the string satisfies the given Regular Expression argument. Note that `RegExp` arguments are serialized as strings.
* `$charAt`: matches if the given index exists in the string and the character at that index matches the given condition expression. The single argument is a tuple containing the index to check and the condition expression: `[number, ConditionExpression<string>]`
* `$length`: matches if the length of the string matches the given condition expression

### Object Field Operators

* `$exists`: for a given field, matches if that field exists (or not) on the target object. A boolean argument indicates the expected existence. Note that the field `"abc"` exists in `{ "abc": "ABC" }` and `{ "abc": undefined }` but not in `{ "def": 2 }`.

### Indexed Object Operators

* `$indexAsArray`: match the indexed object by matching its key-value entries as an array, where each pseudo-element is in the form `{ $key: K, $value: V }`. Note that the `$elementAt` operator is not available in this context, as the order of index values is not deterministic.
* `$indexEntries`: match the indexed object by matching specific key-value entries, similar to known object fields.

### Type Operator

The `$type` operator is useful in the case of union-typed fields, and allows explicitly testing the type of the target value before continuing with other operators, and therefore narrowing the type of the subsequent condition expression. Note that the `$type` operator only supports primitive types. The operator matches if the value is of the given type _and_, if provided, the typed condition expression matches.