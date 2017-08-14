export type char = string;

export default class Char {
	private constructor() {}

	static isLetter(c: char): boolean {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
	}
	
	static isIdBegin(c: char): boolean {
		return Char.isLetter(c) || Char.is(c, '_$');
	}

	static isIdBody(c: char): boolean {
		return Char.isIdBegin(c) || Char.isDigit(c);
	}

	static isDigit(c: char): boolean {
		return c >= '0' && c <= '9';
	}

	static isOperator(c: char): boolean {
		return Char.is(c, '=+-*/!^&|<>~?:');
	}
	
	static isWhitespace(c: char): boolean {
		return Char.is(c, ' \t\r\n');
	}
	
	static isWhitespaceButNl(c: char): boolean {
		return Char.is(c, ' \t');
	}

	static isNewline(c: char): boolean {
		return Char.is(c, '\r\n');
	}

	static is(c: char, chars: string): boolean {
		return chars.includes(c);
	}
}