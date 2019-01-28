import * as Redux from 'redux';
import { CreateAction, props } from './ActionCreator';
import update from 'immutability-helper';

// -----------
// |  STATE  |
// -----------
export type State = {
    user: {
        isAdmin: boolean
        isAuthorized: boolean
        isLoading: boolean
    },
};

const initialState: State = {
    user: {
        isAdmin: false,
        isAuthorized: false,
        isLoading: true,
    },
};


// -----------
// | ACTIONS |
// -----------
export const SetUserData = CreateAction("SetUserData", props<{
    isAdmin: boolean
}>());

export const SetIsAuthorized = CreateAction("SetIsAuthorized", props<{
    isAuthorized: boolean
}>());


type Action = typeof SetUserData.action 
    | typeof SetIsAuthorized.action;

// -----------
// | REDUCER |
// -----------
function reducer(state: State = initialState, action: Action) {
    switch (action.type) {
        case SetUserData.type:
            return update(state, {
                user: {
                    isAdmin: { $set: action.isAdmin },
                    isAuthorized: { $set: true },
                    isLoading: { $set: false },
                },
            } as any);
        case SetIsAuthorized.type:
            return update(state, {
                user: {
                    isAuthorized: { $set: action.isAuthorized },
                    isLoading: { $set: action.isAuthorized },
                }
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