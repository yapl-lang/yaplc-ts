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
		if (single) {
			const {line, start, end} = this.begin.getLine();
			const prefix = this.begin.line + '. ';
			result += prefix + line + '\n';
			result += ' '.repeat(prefix.length) + StringUtil.padOf(line, this.begin.column) + '|\n';
		} else if (singleLine) {
			const {line} = this.begin.getLine();
			const prefix = this.begin.line + '. ';
			result += ' '.repeat(prefix.length) + StringUtil.padOf(line, this.begin.column) + '|\n';
			result += prefix + line + '\n';
			result += ' '.repeat(prefix.length) + StringUtil.padOf(line, (<CodePosition>this.end).column) + '|\n';
		} else {
			const {line: startLine, start} = this.begin.getLine();
			const {line: endLine, end} = (<CodePosition>this.end).getLine();
			const prefixSize = `${(<CodePosition>this.end).line}. `.length;
			result += ' '.repeat(prefixSize) + StringUtil.padOf(startLine, this.begin.column) + '|\n';
			result += StringUtil.prefixLines(this.begin.code.substring(start, end), this.begin.line) + '\n';
			result += ' '.repeat(prefixSize) + StringUtil.padOf(endLine, (<CodePosition>this.end).column) + '|\n';
		}
		return `${result}${super.toString()} at ${this.begin}${this.isPoint ? '' : `-${this.end}`}`;
	}
}