export enum OperatorType {
	PrefixUnary,
	SuffixUnary,
	Binary,
}

export class Operator {
	constructor(readonly value: string, readonly namedValue: string | null, readonly name: string, readonly priority: number, readonly type: OperatorType = OperatorType.Binary) {
	}
}

export const Operators: Operator[] = [
	new Operator('++', 'inc', 'Suffix Increment', 1, OperatorType.SuffixUnary),
	new Operator('--', 'dec', 'Suffix Decrement', 1, OperatorType.SuffixUnary),

	new Operator('++', 'inc', 'Prefix Increment', 2, OperatorType.PrefixUnary),
	new Operator('--', 'dec', 'Prefix Decrement', 2, OperatorType.PrefixUnary),
	new Operator('+', 'plus', 'Unary Plus', 2, OperatorType.PrefixUnary),
	new Operator('-', 'minus', 'Unary Minus', 2, OperatorType.PrefixUnary),

	new Operator('*', 'mult', 'Multiplication', 3, OperatorType.Binary),
	new Operator('/', 'div', 'Division', 3, OperatorType.Binary),
	new Operator('%', 'remain', 'Remainder', 3, OperatorType.Binary),
	new Operator('**', 'pow', 'Power', 3, OperatorType.Binary),

	new Operator('+', 'plus', 'Plus', 4, OperatorType.Binary),
	new Operator('-', 'minus', 'Minus', 4, OperatorType.Binary),

	new Operator('<<', 'shl', 'Bitwise left shift', 5, OperatorType.Binary),
	new Operator('>>', 'shr', 'Bitwise right shift', 5, OperatorType.Binary),

	new Operator('<', 'less', 'Less', 6, OperatorType.Binary),
	new Operator('<=', 'lesseq', 'Less or equal', 6, OperatorType.Binary),
	new Operator('>', 'more', 'More', 6, OperatorType.Binary),
	new Operator('>=', 'moreeq', 'More or equal', 6, OperatorType.Binary),

	new Operator('==', 'equals', 'Equal', 7, OperatorType.Binary),
	new Operator('!=', 'nequals', 'Not equal', 7, OperatorType.Binary),

	new Operator('&', 'band', 'Bitwise AND', 8, OperatorType.Binary),
	new Operator('^', 'xor', 'Bitwise XOR', 9, OperatorType.Binary),
	new Operator('|', 'bor', 'Bitwise OR', 10, OperatorType.Binary),

	new Operator('&&', 'and', 'Logical AND', 11, OperatorType.Binary),
	new Operator('||', 'or', 'Logical OR', 12, OperatorType.Binary),

	new Operator('?', null, 'Ternary if', 13, OperatorType.Binary),
	new Operator(':', null, 'Ternary else', 13, OperatorType.PrefixUnary),


	new Operator('=', 'to', 'Assignment', 14, OperatorType.Binary),

	new Operator('*=', null, 'Assignment via Multiplication', 14, OperatorType.Binary),
	new Operator('/=', null, 'Assignment via Division', 14, OperatorType.Binary),
	new Operator('%=', null, 'Assignment via Remainder', 14, OperatorType.Binary),
	new Operator('**=', null, 'Assignment via Power', 14, OperatorType.Binary),

	new Operator('+=', null, 'Assignment via Plus', 14, OperatorType.Binary),
	new Operator('-=', null, 'Assignment via Minus', 14, OperatorType.Binary),

	new Operator('<<=', null, 'Assignment via Bitwise left shift', 14, OperatorType.Binary),
	new Operator('>>=', null, 'Assignment via Bitwise right shift', 14, OperatorType.Binary),

	new Operator('&=', null, 'Assignment via Bitwise AND', 14, OperatorType.Binary),
	new Operator('^=', null, 'Assignment via Bitwise XOR', 14, OperatorType.Binary),
	new Operator('|=', null, 'Assignment via Bitwise OR', 14, OperatorType.Binary),

	new Operator('&&=', null, 'Assignment via Logical AND', 14, OperatorType.Binary),
	new Operator('||=', null, 'Assignment via Logical OR', 14, OperatorType.Binary),
];

export const OperatorsValues = Operators.map(op => op.value).sort((a, b) => b.length - a.length);
export const OperatorsNamedValues = Operators.filter(a => a.namedValue !== null).map(op => <string>op.namedValue).sort((a, b) => b.length - a.length);

export const OperatorsMap = Operators.reduce((obj: {[key: string]: Operator}, op) => {
	obj[op.value] = op;
	return obj;
}, {});


const providerCache:{[key: string]: Operator} = {};
export const OperatorsProvider = {
	get(value: string, type: OperatorType | null = null): Operator | null {
		const hash = `${type}-${value}`;
		if (hash in providerCache) {
			return providerCache[hash];
		}
		for (const operator of Operators) {
			if ((type === null || type === operator.type) && (operator.value === value || operator.namedValue === value)) {
				return providerCache[hash] = operator;
			}
		}
		return null;
	}
}
