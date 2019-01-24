import { extend } from 'lodash';

type Action<TType extends string, TProps> = TProps & { type: TType };

type ActionCreator<TType extends string, TProps> = {
    readonly type: TType
    readonly action: Action<TType, TProps>
	(props: TProps): Action<TType, TProps>
};

export function CreateAction<TType extends string, TProps>(type: TType, _props: TProps): ActionCreator<TType, TProps> {
	let actionCreator = (props: TProps) => extend({ type: type }, props);
	return extend(actionCreator, { type: type }) as ActionCreator<TType, TProps>;
}

export function props<TProps>(): TProps {
	return undefined!;
}
