import {BaseToken, ValueToken} from './Token';
import {char} from '../util/Char';
import {OperatorsValues} from '../Operators';

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

export class TokenPunctuation extends ValueToken<TokenPunctuation, char> {
	static CHARS: string = ',`(){}[]';

	type = 'punc';
}

export class TokenOperator extends ValueToken<TokenOperator, char> {
	static OPERATORS: string[] = OperatorsValues;

	type = 'op';
}

export class TokenModifier extends ValueToken<TokenModifier> {
	static MODIFIERS: string[] = [
		'private',
		'protected',
		'public',

		'final',
		'abstract',
		'const',
		'data',
		'test',
	];

	type = 'mod';
}

export class TokenKeyword extends ValueToken<TokenKeyword> {
	static KEYWORDS: string[] = [
		'package',
		'use',
		'as',

		'var',
		'val',
		'fun',
		'class',
		'interface',
		
		'extends',
		'implements',

		'if',
		'then',
		'else',

		'null',
		'this',
		'true',
		'false',
	];

	type = 'kw';
}

export class TokenIdentifier extends ValueToken<TokenIdentifier> {
	type = 'id';
}

export class TokenDot extends BaseToken<TokenDot> {
	type = 'dot';
}

export class TokenComment extends ValueToken<TokenComment> {
	type = 'comment';
	isWhitespace = true;

	commentType: string;
}

export class TokenNumber extends ValueToken<TokenNumber> {
	type = 'num';
}

export class TokenString extends ValueToken<TokenString> {
	type = 'str';
	stringType: string;
}
