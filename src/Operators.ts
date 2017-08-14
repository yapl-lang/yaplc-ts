export enum OperatorType {
	PrefixUnary,
	SuffixUnary,
	Binary,
}

export class Operator {
	constructor(readonly value: string, readonly name: string, readonly priority: number, readonly type: OperatorType = OperatorType.Binary) {
	}
}

export const Operators: Operator[] = [
	new Operator('++', 'Suffic Increment', 1, OperatorType.SuffixUnary),
	new Operator('--', 'Suffix Decrement', 1, OperatorType.SuffixUnary),

	new Operator('++', 'Prefix Increment', 2, OperatorType.PrefixUnary),
	new Operator('--', 'Prefix Decrement', 2, OperatorType.PrefixUnary),
	new Operator('+', 'Unary Plus', 2, OperatorType.PrefixUnary),
	new Operator('-', 'Unary Minus', 2, OperatorType.PrefixUnary),

	new Operator('*', 'Multiplication', 3, OperatorType.Binary),
	new Operator('/', 'Division', 3, OperatorType.Binary),
	new Operator('%', 'Remainder', 3, OperatorType.Binary),
	new Operator('**', 'Power', 3, OperatorType.Binary),

	new Operator('+', 'Plus', 4, OperatorType.Binary),
	new Operator('-', 'Minus', 4, OperatorType.Binary),

	new Operator('<<', 'Bitwise left shift', 5, OperatorType.Binary),
	new Operator('>>', 'Bitwise right shift', 5, OperatorType.Binary),

	new Operator('<', 'Less', 6, OperatorType.Binary),
	new Operator('<=', 'Less or equal', 6, OperatorType.Binary),
	new Operator('>', 'More', 6, OperatorType.Binary),
	new Operator('>=', 'More or equal', 6, OperatorType.Binary),

	new Operator('==', 'Equal', 7, OperatorType.Binary),
	new Operator('!=', 'Not equal', 7, OperatorType.Binary),

	new Operator('&', 'Bitwise AND', 8, OperatorType.Binary),
	new Operator('^', 'Bitwise XOR', 9, OperatorType.Binary),
	new Operator('|', 'Bitwise OR', 10, OperatorType.Binary),

	new Operator('&&', 'Logical AND', 11, OperatorType.Binary),
	new Operator('||', 'Logical OR', 12, OperatorType.Binary),

	new Operator('?', 'Ternary if', 13, OperatorType.Binary),
	new Operator(':', 'Ternary else', 13, OperatorType.PrefixUnary),


	new Operator('=', 'Assignment', 14, OperatorType.Binary),

	new Operator('*=', 'Assignment via Multiplication', 14, OperatorType.Binary),
	new Operator('/=', 'Assignment via Division', 14, OperatorType.Binary),
	new Operator('%=', 'Assignment via Remainder', 14, OperatorType.Binary),
	new Operator('**=', 'Assignment via Power', 14, OperatorType.Binary),

	new Operator('+=', 'Assignment via Plus', 14, OperatorType.Binary),
	new Operator('-=', 'Assignment via Minus', 14, OperatorType.Binary),

	new Operator('<<=', 'Assignment via Bitwise left shift', 14, OperatorType.Binary),
	new Operator('>>=', 'Assignment via Bitwise right shift', 14, OperatorType.Binary),

	new Operator('&=', 'Assignment via Bitwise AND', 14, OperatorType.Binary),
	new Operator('^=', 'Assignment via Bitwise XOR', 14, OperatorType.Binary),
	new Operator('|=', 'Assignment via Bitwise OR', 14, OperatorType.Binary),

	new Operator('&&=', 'Assignment via Logical AND', 14, OperatorType.Binary),
	new Operator('||=', 'Assignment via Logical OR', 14, OperatorType.Binary),
];

export const OperatorsValues = Operators.map(op => op.value).sort((a, b) => b.length - a.length);

export const OperatorsMap = Operators.reduce((obj: {[key: string]: Operator}, op) => {
	obj[op.value] = op;
	return obj;
}, {});
