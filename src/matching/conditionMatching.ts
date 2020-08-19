import { ConditionExpression, ConditionExpressionOrImplicitEq } from './conditionTypes';
import { AllOperatorKeys, isOperatorKey } from './operatorTypes';
import { MatchContext, isObjectMatchContext } from './MatchContext';
import { logicalOperatorHandlers } from './logicalOperators'
import { comparisonOperatorHandlers } from './comparisonOperators';
import { equalityOperatorHandlers } from './equalityOperators';
import { setOperatorHandlers } from './setOperators';
import { objectOperatorHandlers, checkExistsThenOtherOperators } from './objectOperators';
import { typeOperatorHandlers } from './typeOperator';
import { arrayOperatorHandlers } from './arrayOperators';
import { stringOperatorHandlers } from './stringOperators';

export function isExactMatch<T>(t: T, condition: ConditionExpression<T>): boolean {

    return isExactMatchInternal(MatchContext.of(t), condition)
}

export function isExactMatchInternal<T, R, C extends ConditionExpressionOrImplicitEq<T>>(matchContext: MatchContext<T, R>, condition: C, ignoreOperatorKeys = false): boolean {

    if (typeof condition === 'object') {
        return Object.entries(condition)
            .every(([key, operandOrSubCondition]) => {

                if (!ignoreOperatorKeys && isOperatorKey(key)) {
                    if (operandOrSubCondition === undefined) {
                        throw new Error('operand undefined for operator: ' + key)
                    }

                    const operatorHandler = operatorHandlers[key]

                    if (!operatorHandler) {
                        throw new Error('unknown operator: ' + key)
                    }

                    const operatorResult = operatorHandler(matchContext, operandOrSubCondition, condition);

                    console.log(`result for operator ${key}(${JSON.stringify(operandOrSubCondition)}) on value ${JSON.stringify(matchContext.currentValue)} at [${matchContext.getPathString()}]: ${operatorResult}`)

                    return operatorResult

                } else if (isObjectMatchContext(matchContext)) {
                    return checkExistsThenOtherOperators(matchContext.fieldPathContext(key), operandOrSubCondition)
                } else {
                    throw new Error('cannot apply sub-condition on non-object. Current value: ' + matchContext.currentValue)
                }
            })
    } else {
        return equalityOperatorHandlers.$eq(matchContext, condition, condition)
    }
}


export type OperatorHandler = <T, R>(matchContext: MatchContext<T, R>, operand: any, condition: ConditionExpressionOrImplicitEq<T>) => boolean;

type OperatorHandlerMap = {
    [OP in AllOperatorKeys]: OperatorHandler
}

const operatorHandlers: OperatorHandlerMap = {
    ...logicalOperatorHandlers,
    ...typeOperatorHandlers,
    ...objectOperatorHandlers,
    ...equalityOperatorHandlers,
    ...comparisonOperatorHandlers,
    ...setOperatorHandlers,
    ...arrayOperatorHandlers,
    ...stringOperatorHandlers
}
