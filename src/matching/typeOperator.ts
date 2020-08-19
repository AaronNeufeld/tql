import { KnownKeys } from '../util/types';
import { ConditionExpression, BasicConditionExpressionOrLogicalOp } from './conditionTypes';
import { OperatorHandler, isExactMatchInternal } from './conditionMatching';
import { MatchContext } from './MatchContext';

export type TypeOperator =
    TypeAssertWOptionalAnd<'string', string>
    | TypeAssertWOptionalAnd<'boolean', boolean>
    | TypeAssertWOptionalAnd<'number', number>
    | TypeAssertWOptionalAnd<'bigint', bigint>;

type TypeAssertWOptionalAnd<
    TS extends 'string' | 'boolean' | 'number' | 'bigint',
    T extends string | boolean | number | bigint
    > = {
        /**
         * Test that the value is of the given type
         */
        $type: TS | [TS, BasicConditionExpressionOrLogicalOp<T>],
    }

export const typeOperatorHandlers: {
    [K in KnownKeys<TypeOperator>]: OperatorHandler
} = {
    $type: <T, R>(
        matchContext: MatchContext<T, R>,
        operand: TypeOperator['$type']
    ) => {
        const expectedType = typeof operand === 'string' ? operand : operand[0]
        const typedCondition = typeof operand === 'string' ? undefined : operand[1]

        if (typeof matchContext.currentValue !== expectedType) {
            return false
        }

        if (typedCondition === undefined) {
            return true
        } else {
            return isExactMatchInternal(matchContext, typedCondition as ConditionExpression<T>)
        }
    }
}