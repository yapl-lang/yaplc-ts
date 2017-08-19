import CodePosition from '../CodePosition';

export default abstract class Token {
	begin: CodePosition;
	end: CodePosition;

	readonly abstract type: string;
	readonly isWhitespace: boolean = false;

	protected constructor(init?: any) {
		Object.assign(this, init);
	}

	public toJSON() {
		const result: { [s: string]: any; } = {};
		Object.keys(this).forEach(key => {
			const value = (<any>this)[key];
			if ((key === 'begin' || key === 'end') && value instanceof CodePosition) {
				result[key] = value.toString();
			} else if (key !== 'isWhitespace') {
				result[key] = value;
			}
		});
		return result;
	}

	public toString(): string {
		return JSON.stringify(this);
	}
}

export abstract class BaseToken<Self> extends Token {
	public constructor(init?: Partial<Self>) {
		super(init);
	}
}

