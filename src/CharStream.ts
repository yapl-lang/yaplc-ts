import CodePosition from './CodePosition';
import { char } from './util/Char';

export default class CharStream {
	private input: string;
	private pos: number = 0;
	private line: number = 1;
	private column: number = 0;
	private cachedPosition: CodePosition | null = null;

	get position(): CodePosition {
		if (this.cachedPosition === null) {
			this.cachedPosition = new CodePosition(this.input, this.pos, this.line, this.column);
		}
		return this.cachedPosition;
	}

	constructor(input: string) {
		this.input = input;
	}

	public peek(): char {
		return this.input[this.pos];
	}

	public next(): char {
		this.cachedPosition = null;
		let ch = this.input[this.pos++];
		if (ch === '\n') {
			++this.line;
			this.column = 0;
		} else {
			++this.column;
		}
		return ch;
	}

	public eof(): boolean {
		return this.pos >= this.input.length;
	}

	public eol(): boolean {
		return this.peek() === '\n';
	}
}