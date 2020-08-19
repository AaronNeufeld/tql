# TQL: Selecting

TQL supports selecting subsets of data, both horizontal (narrowing: reducing the size of an object) and vertical (filtering: reducing the size of an array or index).

## Horizontal Subsets (Narrowing)

The size of an object can be reduced by only retrieving certain fields, and by recursively reducing the size of each field value. At the top level, this is comparable to `SELECT a, b` vs. `SELECT *` in SQL.

For every object field, there are three basic options:

* `false`: exclude this field. This is the default, if the field is excluded from the query.
* `true`: include this field in its entirety
* `{ $includeIf: <condition> }`: include this field if it matches the given condition expression (see [Matching](matching.md))

Depending on the type of the field, there may be additional options:

* `{ <subField1>: <subQuery1>, <subField2>: <subQuery2> }`: for object (non-array) fields, narrow the field type
* `{ $elementQuery: <subQuery> }`: for non-primitive array fields, narrow the element type
* `{ $indexedQuery: <subQuery> }`: for indexed object fields, narrow the indexed type

## Vertical Subsets (Filtering)

Arrays and indexed objects can be filtered by providing a condition expression to match against each element. Note that filtering is done before narrowing, so condition expressions can reference all fields of an object, even if they are not return in the result.

## Returning an Indexed Object as an Array

Sometimes data stored in an index needs to be processed as an array, so it order to further reduce the amount of data returned, the values of an index can be returned as an array by specifying `{ $asArray: true }` for an indexed object.