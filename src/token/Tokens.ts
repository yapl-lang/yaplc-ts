import {BaseToken} from './Token';
import {char} from '../util/Char';

export class TokenNewline extends BaseToken<TokenNewline> {
	type = 'nl';
	isWhitespace = true;
}

export class TokenEof extends BaseToken<TokenEof> {
	type = 'eof';
}

export class TokenIndent extends BaseToken<TokenIndent> {
	type = 'ind';
	isWhitespace = true;
}

export class TokenOutdent extends BaseToken<TokenIndent> {
	type = 'outd';
	isWhitespace = true;
}

export class TokenWhitespace extends BaseToken<TokenWhitespace> {
	type = 'whsp';
	isWhitespace = true;

	value: string;
}

export class TokenSemicolon extends BaseToken<TokenSemicolon> {
	type = 'semi';
	isWhitespace = true;
}

export class TokenPunctuation extends BaseToken<TokenPunctuation> {
	static CHARS: string = ',(){}[]';

	type = 'punc';
	value: char;
}

export class TokenOperator extends BaseToken<TokenOperator> {
	static OPERATORS: string[] = [
		// TODO: Some way to parse set operators(+=, -=, etc.)

		'=',

		// Arithmetic
		'+',
		'-',
		'/',
		'*',

		'^',
		'%',

		// Equality
		'==',
		'!=',
		'>',
		'<',
		'>=',
		'<=',

		// Boolean
		'!',
		'&&',
		'||',

		// Bit
		'>>',
		'<<',
		// Need unsigned right shift?
		'~',
		'&',
		'|',

		// Short if-else
		'?',
		':',
	].sort((a, b) => b.length - a.length);

	type = 'op';
	value: char;
}

export class TokenKeyword extends BaseToken<TokenKeyword> {
	static KEYWORDS: string[] = [
		'package',
		'fun',
		'var',
		'val',
		'use',

		'null',
		'this',
	];

	type = 'kw';
	value: string;
}

export class TokenIdentifier extends BaseToken<TokenIdentifier> {
	type = 'id';
	value: string;
}

export class TokenDot extends BaseToken<TokenDot> {
	type = 'dot';
}

export class TokenComment extends BaseToken<TokenComment> {
	type = 'comment';
	isWhitespace = true;

	commentType: string;
	value: string;
}

export class TokenNumber extends BaseToken<TokenNumber> {
	type = 'num';

	value: string;
}

export class TokenString extends BaseToken<TokenString> {
	type = 'str';

	stringType: string;
	value: string;
}
