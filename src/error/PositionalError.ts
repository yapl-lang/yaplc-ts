import CodePosition from '../CodePosition';
import StringUtil from '../util/String';
import Error from './Error';

export default abstract class PositionalError extends Error {
	get position() {
		return this.begin;
	}

	get isPoint() {
		return this.end === null || this.begin.equals(this.end);
	}

	public constructor(message: string, readonly begin: CodePosition, readonly end: CodePosition | null = null) {
		super(message);
	}

	public toString(): string {
		const single = this.end === null || this.begin.equals(this.end);
		const singleLine = single || this.begin.line === (<CodePosition>this.end).line;
		let result: string = '';
		// TODO: Print line before code
		if (single) {
			const {line, start, end} = this.begin.getLine();
			result += line + '\n';
			result += StringUtil.padOf(line, this.begin.column) + '|\n';
		} else if (singleLine) {
			const {line} = this.begin.getLine();
			result += StringUtil.padOf(line, this.begin.column) + '|\n';
			result += line + '\n';
			result += StringUtil.padOf(line, (<CodePosition>this.end).column - 1) + '|\n';
		} else {
			const {line: startLine, start} = this.begin.getLine();
			const {line: endLine, end} = (<CodePosition>this.end).getLine();
			result += StringUtil.padOf(startLine, this.begin.column) + '|\n';
			result += this.begin.code.substring(start, end) + '\n';
			result += StringUtil.padOf(endLine, (<CodePosition>this.end).column - 1) + '|\n';
		}
		return `${result}${super.toString()} at ${this.begin}${this.isPoint ? '' : `-${this.end}`}`;
	}
}