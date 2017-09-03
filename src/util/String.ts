import Char from './Char';

export default class String {
	private constructor() {}

	static getLineOn(str: string, offset: number): {line: string, start: number, end: number} {
		let start = offset, end = offset;
		while (start !== 0 && str[start - 1] !== '\n') {
			--start;
		}
		while (end !== str.length && str[end] !== '\n') {
			++end;
		}
		return {
			get line(): string {
				delete this.line;
				return this.line = str.substring(start, end);
			},
			start, end
		};
	}

	static padOf(str: string, start: number, end: number = -1) {
		if (end === -1) {
			end = start;
			start = 0;
		}
		for (let i = start; i <= end; ++i) {
			if (!Char.isWhitespace(str[i])) {
				return str.substring(start, i) + ' '.repeat(end - i);
			}
		}
		return '';
	}

	static prefixLines(str: string, start: number): string {
		const linesCount = str.split('').reduce((val, ch) => val + (ch === '\n' ? 1 : 0), 1);
		const end = start + linesCount;
		const minL = `${end}. `.length;

		return ('\n' + str).replace(/\n/g, (str) => {
			let num = `${start++}.`;
			num += ' '.repeat(minL - num.length);
			return '\n' + num;
		}).substr(1);
	}

	static escape(str: string): string {
		return str.replace(/\r\n\t'"\\/g, (unused, c) => '\\' + c);
	}
}