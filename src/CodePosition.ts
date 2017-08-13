import StringUtil from './util/String';

export default class CodePosition {
	readonly code: string;
	readonly offset: number;
	private cachedLine: number | null;
	private cachedColumn: number | null;

	get line(): number {
		if (this.cachedLine === null) {
			this.cacheLineAndColumn();
		}
		return <number>this.cachedLine;
	}

	get column(): number {
		if (this.cachedColumn === null) {
			this.cacheLineAndColumn();
		}
		return <number>this.cachedColumn;
	}

	public constructor(code: string, offset: number, line: number | null = null, column: number | null = null) {
		this.code = code;
		this.offset = offset;
		this.cachedLine = line;
		this.cachedColumn = column;
	}

	public getLine() {
		return StringUtil.getLineOn(this.code, this.offset);
	}

	private cacheLineAndColumn() {
		this.cachedLine = 1;
		this.cachedColumn = 0;
		for (let i: number = 0; i < this.offset; ++i) {
			if (this.code[i] === '\n') {
				++this.cachedLine;
				this.cachedColumn = 0;
			} else {
				++this.cachedColumn;
			}
		}
	}

	public relative(offset: number): CodePosition {
		if (offset === 0) {
			return this;
		}
		return new CodePosition(this.code, this.offset + offset);
	}

	public until(other: CodePosition): string {
		if (other.code !== this.code) {
			throw new Error('Positions are with different code');
		}
		const [a, b]: number[] = [this.offset, other.offset].sort();
		return this.code.substring(a, b);
	}

	public equals(other: CodePosition): boolean {
		return this.code === other.code && this.offset === other.offset;
	}

	public toString(): string {
		return `${this.line}:${this.column}`
	}
}