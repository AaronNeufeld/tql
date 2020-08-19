import { ConditionExpression, ConditionExpressionOrImplicitEq } from './conditionTypes';
import { KnownKeys } from '../util/types';
import { OperatorHandler, isExactMatchInternal } from './conditionMatching';
import { MatchContext, isStringMatchContext } from './MatchContext';
import { compareToCurrent } from './operatorHelpers';
import { ValueOrRef } from './FieldReference'

export type StringOperator =
    CaseInsensitiveEqualOperator
    | ContainsOperator
    | StartsWithOperator
    | EndsWithOperator
    | RegexMatchOperator
    | CharAtOperator
    | StringLengthOperator;

export type CaseInsensitiveEqualOperator = {
    /**
     * Test that the string equals the given string, irrespective of casing
     * 
     * For case-sensitive equality, see $eq
     */
    $eqi: ValueOrRef<string>
};
export type ContainsOperator = {
    /**
     * Test that the string contains the given string anywhere within
     * 
     * See also:
     * $startsWith
     * $endsWith
     * $regex
     */
    $contains: ValueOrRef<string>
};
export type StartsWithOperator = {
    /**
     * Test that the string starts with the given string
     * 
     * See also:
     * $contains
     * $endsWith
     * $regex
     */
    $startsWith: ValueOrRef<string>
};
export type EndsWithOperator = {
    /**
     * Test that the string ends with the given string
     * 
     * See also:
     * $contains
     * $startsWith
     * $regex
     */
    $endsWith: ValueOrRef<string>
};
export type RegexMatchOperator = {
    /**
     * Test that the string matches the given regular expression
     * 
     * See also:
     * $contains
     * $startsWith
     * $endsWith
     * $eqi
     */
    $regexp: RegExp
};
export type CharAtOperator = {
    /**
     * Test that the character at the given index matches the given condition
     */
    $charAt: [number, ConditionExpression<string>],
};
export type StringLengthOperator = {
    /**
     * Test that the length of the string matches the given condition (or value, same as using $eq condition)
     */
    $length: ConditionExpressionOrImplicitEq<number>
};


export const stringOperatorHandlers: {
    [K in KnownKeys<StringOperator>]: OperatorHandler
} = {

    $eqi: stringOp<CaseInsensitiveEqualOperator>((a, b) => a.toLowerCase() === b.toLowerCase()),
    $contains: stringOp<ContainsOperator>((a, b) => a.includes(b)),
    $startsWith: stringOp<StartsWithOperator>((a, b) => a.startsWith(b)),
    $endsWith: stringOp<EndsWithOperator>((a, b) => a.startsWith(b)),

    $regexp: <T, R>(
        matchContext: MatchContext<T, R>,
        operand: RegexMatchOperator['$regexp'] | string
    ) => {
        if (!isStringMatchContext(matchContext)) {
            return false
        }

        let regexp: RegExp
        if (typeof operand === 'string') {
            // handle serialized regexp
            const lastSlash = operand.lastIndexOf('/')
            const exp = operand.substring(1, lastSlash)
            const flags = operand.substr(lastSlash + 1, operand.length - 1)

            regexp = new RegExp(exp, flags)

        } else if (operand instanceof RegExp) {
            regexp = operand
        } else {
            throw new Error('invalid $regexp operand: ' + operand)
        }

        return regexp.test(matchContext.currentValue)
    },

    $charAt: <T, R>(
        matchContext: MatchContext<T, R>,
        charAtCondition: CharAtOperator['$charAt']
    ) => {
        if (!isStringMatchContext(matchContext)) {
            return false
        }

        const [index, charCondition] = charAtCondition

        return matchContext.currentValue.length > index && isExactMatchInternal(matchContext.elementContext(index), charCondition)
    },

    $length: <T, R>(
        matchContext: MatchContext<T, R>,
        lengthCondition: StringLengthOperator['$length']
    ) => isStringMatchContext(matchContext)
        && isExactMatchInternal(matchContext.deriveContext(matchContext.currentValue.length, 'length'), lengthCondition)
}

function stringOp<OP extends { [op: string]: ValueOrRef<string> }>(comparisonFn: (a: string, b: string) => boolean): OperatorHandler {
    return <T, R>(
        matchContext: MatchContext<T, R>,
        valueOrRef: OP[string]
    ) => isStringMatchContext(matchContext)
        && compareToCurrent(matchContext, valueOrRef, comparisonFn)
}