import { BasicConditionExpressionOrLogicalOp, ConditionExpression } from './conditionTypes';
import { KnownKeys } from '../util/types';
import { OperatorHandler, isExactMatchInternal } from './conditionMatching';
import { MatchContext } from './MatchContext';
import { negate } from './operatorHelpers';

export type LogicalOperator<T> = AndOperator<T> | OrOperator<T> | NorOperator<T> | NotOperator<T>;

export type AndOperator<T> = {
    /**
     * Test that all of the given conditions match
     */
    $and: BasicConditionExpressionOrLogicalOp<T>[]
};
export type OrOperator<T> = {
    /**
     * Test that at least one of the given conditions match
     */
    $or: ConditionExpression<T>[]
};
export type NorOperator<T> = {
    /**
     * Test that none of the given conditions match
     */
    $nor: ConditionExpression<T>[]
};
export type NotOperator<T> = {
    /**
     * Test that the given condition does not match
     */
    $not: ConditionExpression<T>
};

export const logicalOperatorHandlers: {
    [K in KnownKeys<LogicalOperator<any>>]: OperatorHandler
} = {
    $and: <T, R>(
        matchContext: MatchContext<T, R>,
        subConditions: AndOperator<T>['$and']
    ) => Array.isArray(subConditions) && subConditions.every(subCondition => isExactMatchInternal(matchContext, subCondition as ConditionExpression<T>)),

    $or: <T, R>(
        matchContext: MatchContext<T, R>,
        subConditions: OrOperator<T>['$or']
    ) => Array.isArray(subConditions) && subConditions.some(subCondition => isExactMatchInternal(matchContext, subCondition)),

    $nor: negate(() => logicalOperatorHandlers.$or),

    $not: <T, R>(
        matchContext: MatchContext<T, R>,
        subCondition: NotOperator<T>['$not']
    ) => !isExactMatchInternal(matchContext, subCondition),
}