import CodePosition from '../CodePosition';
import PositionalError from './PositionalError';

export default class SyntaxError extends PositionalError {
	name: string = 'Syntax';

	constructor(message: string, begin: CodePosition, end: CodePosition | null = null) {
		super(message, begin, end);
	}
}