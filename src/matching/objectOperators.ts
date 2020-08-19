import { isEqualOperator, equalityOperatorHandlers } from './equalityOperators'
import { IndexTypeOf, IndexedTypeOf, KnownKeys, Index, IndexKey } from '../util/types'
import { ConditionExpressionOrImplicitEq, ConditionExpression, ObjectFieldConditionExpression, BasicConditionExpressionOrLogicalOp } from './conditionTypes'
import { OperatorHandler, isExactMatchInternal } from './conditionMatching'
import { MatchContext, isObjectEntryMatchContext } from './MatchContext'
import { ArrayOperatorIterationTarget } from './arrayOperators'
import { ValueOrRef } from './FieldReference'

// just for typing the operator handler map below
type ObjectOperator =
    ExistsOperator
    | IndexedObjectOperator<any>
    | ObjectEntryOperator<any, any>;

export type ExistsOperator = {
    /**
     * Test if the property exists on the object
     */
    $exists: ValueOrRef<boolean>
};

export function isExistsOperator(op: any): op is ExistsOperator {
    return typeof op === 'object' && Object.prototype.hasOwnProperty.call(op, '$exists')
}

export type IndexedObjectOperator<T extends {}> = IndexAsArrayOperator<T> | IndexEntriesOperator<T>;

type IndexAsArrayOperator<T extends {}> = {
    /**
     * Test conditions against the array of key-value entries in the index
     */
    $indexAsArray: BasicConditionExpressionOrLogicalOp<ObjectEntry<IndexTypeOf<T>, IndexedTypeOf<T>>[]>
}

type IndexEntriesOperator<T extends {}> = {
    /**
     * Test conditions against various entries in the index.
     */
    $indexEntries: Index<ObjectFieldConditionExpression<IndexedTypeOf<T>>, IndexTypeOf<T>>
}

export type ObjectEntryOperator<K extends IndexKey, V> = {
    /**
     * Test that the key of the entry matches the given condition
     */
    $key: ConditionExpressionOrImplicitEq<K>
} | {
    /**
     * Test that the value of the entry matches the given condition
     */
    $value: ConditionExpressionOrImplicitEq<V>
};

export type ObjectEntry<K extends IndexKey, V> = {
    $key: K,
    $value: V
};
function hasObjectEntryKey(obj: any, key: keyof ObjectEntry<IndexKey, any>) : boolean {
    return Object.prototype.hasOwnProperty.call(obj, key)
}
export function isObjectEntry<K extends IndexKey, V>(obj: any): obj is ObjectEntry<K, V> {
    return hasObjectEntryKey(obj, '$key') && hasObjectEntryKey(obj, '$value')
};

type IndexAsArrayOperatorTarget<T> = ArrayOperatorIterationTarget<IndexedTypeOf<T>, ObjectEntry<IndexTypeOf<T>, IndexedTypeOf<T>>>;

/**
 * Prioritize checking the existence of the field before continuing to test other operators.
 * If the field does not exist, this will short circuit according to the `$exists` operator
 * if present, otherwise returning false.
 * 
 * @param matchContext The current field being matched
 * @param subCondition The condition object for the field
 */
export function checkExistsThenOtherOperators<T, R>(matchContext: MatchContext<T, R>, subCondition: ConditionExpressionOrImplicitEq<T>): boolean {

    if (isExistsOperator(subCondition)) {
        if (typeof subCondition.$exists !== 'boolean') {
            throw new Error('invalid argument for operator $exists: ' + subCondition.$exists)
        }
        
        if (!subCondition.$exists || !matchContext.currentFieldExists) {
            return subCondition.$exists === matchContext.currentFieldExists
        }
    } else if (!matchContext.currentFieldExists) {
        return false
    }

    return isExactMatchInternal(matchContext, subCondition)

}

export const objectOperatorHandlers: {
    [K in KnownKeys<ObjectOperator>]: OperatorHandler
} = {
    // exists is checked first separately, so just return true here
    $exists: () => true,
    
    $indexAsArray: <T, R>(
        matchContext: MatchContext<T, R>,
        indexAsArrayCondition: IndexAsArrayOperator<T>['$indexAsArray']
    ) => {
        if (isEqualOperator(indexAsArrayCondition)) {
            return equalityOperatorHandlers.$eq(matchContext, indexAsArrayCondition.$eq, indexAsArrayCondition as ConditionExpressionOrImplicitEq<T>)
        } else {
            return isExactMatchInternal(
                matchContext.deriveContext<IndexAsArrayOperatorTarget<T>>(
                    {
                        $forContains: () => iterateValues(matchContext.currentValue),
                        $forMatch: () => iterateEntries(matchContext.currentValue),
                        $size: () => Object.keys(matchContext.currentValue).length
                    },
                    '$indexAsArray')
                , indexAsArrayCondition as ConditionExpressionOrImplicitEq<T & IndexAsArrayOperatorTarget<T>>)
        }
    },

    $key: <K extends IndexKey, R>(
        matchContext: MatchContext<K, R>,
        keyCondition: ConditionExpressionOrImplicitEq<K>
    ) => isObjectEntryMatchContext<K, unknown, R>(matchContext) && isExactMatchInternal(matchContext.fieldContext('$key'), keyCondition),

    $value: <V, R>(
        matchContext: MatchContext<V, R>,
        valueCondition: ConditionExpressionOrImplicitEq<V>
    ) => isObjectEntryMatchContext<IndexKey, V, R>(matchContext) && isExactMatchInternal(matchContext.fieldContext('$value'), valueCondition),

    $indexEntries: <T, R>(
        matchContext: MatchContext<T, R>,
        indexedCondition: IndexEntriesOperator<T>['$indexEntries']
    ) => isExactMatchInternal(matchContext, indexedCondition as unknown as ConditionExpression<T>, true)
}

function* iterateValues<T extends {}>(obj: T): Iterable<IndexedTypeOf<T>> {
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            continue
        }

        yield obj[key] as IndexedTypeOf<T>
    }
}

function* iterateEntries<T extends {}>(obj: T): Iterable<ObjectEntry<IndexTypeOf<T>, IndexedTypeOf<T>>> {
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            continue
        }

        yield { $key: key as unknown as IndexTypeOf<T>, $value: obj[key] as IndexedTypeOf<T> }
    }
}