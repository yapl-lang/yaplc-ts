import CodePosition from '../CodePosition';
import Error from './Error';

export default abstract class PositionalError extends Error {
	readonly begin: CodePosition;
	readonly end: CodePosition | null;

	get position() {
		return this.begin;
	}

	get isPoint() {
		return this.end === null || this.begin.equals(this.end);
	}

	public constructor(message: string, begin: CodePosition, end: CodePosition | null = null) {
		super(message);
		this.begin = begin;
		this.end = end;
	}

	public toString(): string {
		return `${super.toString()} at ${this.begin}${this.isPoint ? '' : `-${this.end}`}`;
	}
}