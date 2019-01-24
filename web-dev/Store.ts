import * as Redux from 'redux';
import { CreateAction, props } from './ActionCreator';
import update from 'immutability-helper';

// -----------
// |  STATE  |
// -----------
export type State = {
    hasBeenOpenForMoreThan5Seconds: boolean // example
    isAuthorized: boolean
};

const initialState: State = {
    hasBeenOpenForMoreThan5Seconds: false,
    isAuthorized: false,
};


// -----------
// | ACTIONS |
// -----------
export const SetHasBeenOpenForMoreThan5Seconds = CreateAction("SetHasBeenOpenForMoreThan5Seconds", props<{
    hasBeenOpenForMoreThan5Seconds: boolean
}>());

export const SetIsAuthorized = CreateAction("SetIsAuthorized", props<{
    isAuthorized: boolean
}>());


type Action = typeof SetHasBeenOpenForMoreThan5Seconds.action 
    | typeof SetIsAuthorized.action;


// -----------
// | REDUCER |
// -----------
function reducer(state: State = initialState, action: Action) {
    switch (action.type) {
        case SetHasBeenOpenForMoreThan5Seconds.type:
            return update(state, {
                hasBeenOpenForMoreThan5Seconds: { $set: action.hasBeenOpenForMoreThan5Seconds },
            } as any);
        case SetIsAuthorized.type:
            return update(state, {
                isAuthorized: { $set: action.isAuthorized },
            } as any);
        default: 
            return state;
    }
};

// -----------
// |  STORE  |
// -----------
export var store = Redux.createStore(
    reducer, 
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()    
);