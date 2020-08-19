import { Query, isValueQuery, isObjectArrayQuery, isObjectQuery, ValueQuery, ArrayQuery, ObjectQuery, isIndexedObjectQuery, ObjectSubquery, IndexQuery, isArrayQuery, isIndexAsArray, isIndexQuery } from './queryTypes'
import { QueryResult, ObjectQueryResult, IndexedObjectQueryResult, ObjectSubqueryResult, ArrayQueryResult } from './queryResultTypes'
import { isExactMatch } from './matching/conditionMatching'
import { ItChain } from './util/iterable'
import { ConditionExpression } from 'matching/conditionTypes'

export function executeQuery<T, Q extends Query<T>>(t: T, query: Q): QueryResult<T, Q> {

    if (t === undefined || t === null) {
        return t as unknown as QueryResult<T, Q>
    }

    if (isValueQuery<T>(query)) {
        return executeValueQuery(t, query).value as unknown as QueryResult<T, Q>
    } else if (typeof t === 'object') {
        if (Array.isArray(t) && isArrayQuery(query)) {
            return executeArrayQuery(t, query) as unknown as QueryResult<T, Q>
        } else {
            if (isObjectQuery(t, query)) {
                return executeObjectQuery(t, query) as unknown as QueryResult<T, Q>
            }
        }
    }

    throw new Error(`for value ${t} given unknown query: ${JSON.stringify(query)}`)
}

type ValueQueryResultInternal<T> = {
    value: T | undefined,
    include: boolean
};

function executeValueQuery<T>(t: T, query: ValueQuery<T>): ValueQueryResultInternal<T> {

    const include: boolean =
        typeof query === 'boolean' ? query
            : isExactMatch(t, query.$includeIf)

    return {
        value: include ? t : undefined,
        include
    }
}

function executeArrayQuery<E, T extends E[], Q extends ArrayQuery<E>>(t: T, arrayQuery: Q): ArrayQueryResult<E, Q> {

    const filteredArray = arrayQuery.$filter
        ? filterArray(t, arrayQuery.$filter)
        : t

    if (isObjectArrayQuery<E>(arrayQuery)) {
        return filteredArray.map(e => executeQuery(e, arrayQuery.$elementQuery) as any) as ArrayQueryResult<E, Q>
    } else {
        return filteredArray as ArrayQueryResult<E, Q>
    }

    function filterArray<E>(array: E[], condition: ConditionExpression<E>): E[] {
        return array.filter(e => isExactMatch(e, condition))
    }
}

function executeObjectQuery<T, Q extends ObjectQuery<T>>(t: T, query: Q): ObjectQueryResult<T, Q> {

    if (isIndexQuery<T>(query)) {
        return executeIndexQuery(t, query) as unknown as ObjectQueryResult<T, Q>
    } else {
        return executeObjectSubquery(t, query as ObjectSubquery<T>) as unknown as ObjectQueryResult<T, Q>
    }
}

function executeIndexQuery<T, Q extends IndexQuery<T>>(t: T, query: Q): IndexedObjectQueryResult<T, Q> {

    const filteredEntries = ItChain.fromEntriesOf(t)
        .maybeFilter(
            query.$filter,
            (filterCondition, [$key, $value]) => isExactMatch({ $key, $value }, filterCondition))

    if (isIndexAsArray(query)) {
        return filteredEntries.reduce((result, [, $value]) => [
            ...result,
            isIndexedObjectQuery<T>(query)
                ? executeQuery($value, query.$indexedQuery) as any
                : $value
        ] as any[], [] as any[]) as IndexedObjectQueryResult<T, Q>
    } else {
        return filteredEntries.reduce((result, [$key, $value]) => ({
            ...result,
            [$key]: isIndexedObjectQuery<T>(query)
                ? executeQuery($value, query.$indexedQuery)
                : $value
        } as any), {} as any) as IndexedObjectQueryResult<T, Q>
    }
}

function executeObjectSubquery<T, Q extends ObjectSubquery<T>>(t: T, query: Q): ObjectSubqueryResult<T, Q> {

    return ItChain.fromKeysOf(query)
        .filter(k => {
            if (isValueQuery(query[k])) {
                if (typeof query[k] === 'boolean') {
                    return !!query[k]
                } else {
                    return isExactMatch(t[k as keyof T], query[k] as any)
                }
            } else {
                return !!query[k]
            }
        })
        .toIndex(
            k => k,
            k => executeQuery(t[k as keyof T], query[k] as any)
        ) as unknown as ObjectSubqueryResult<T, Q>
}