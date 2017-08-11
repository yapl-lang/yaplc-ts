import CodePosition from '../CodePosition';

export default abstract class Token {
	begin: CodePosition;
	end: CodePosition;

	readonly abstract type: string;
	readonly isWhitespace: boolean = false;

	protected constructor(init?: any) {
		Object.assign(this, init);
	}
}

export abstract class BaseToken<Self> extends Token {
	public constructor(init?: Partial<Self>) {
		super(init);
	}
}

