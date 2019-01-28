import * as Redux from 'redux';
import { CreateAction, props } from './ActionCreator';
import update from 'immutability-helper';

// -----------
// |  STATE  |
// -----------
export type LoadingInfo = {
    app: boolean
    topics: boolean
    user: boolean
}

export type State = {
    loading: LoadingInfo
    user: {
        isAdmin: boolean
        isAuthorized: boolean
    },
    topics: Topic[]
};

const initialState: State = {
    loading: {
        app: true,
        topics: true,
        user: true,
    },
    user: {
        isAdmin: false,
        isAuthorized: false,
    },
    topics: [],
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

export const SetTopics = CreateAction("SetTopics", props<{
    topics: Topic[] 
}>());


type Action = typeof SetUserData.action 
    | typeof SetIsAuthorized.action
    | typeof SetTopics.action;

// -----------
// | REDUCER |
// -----------
function reducer(state: State = initialState, action: Action) {
    switch (action.type) {
        case SetUserData.type:
            return update(state, {
                loading: {
                    user: { $set: false },
                },
                user: {
                    isAdmin: { $set: action.isAdmin },
                    isAuthorized: { $set: true },
                },
            } as any);
        case SetIsAuthorized.type:
            return update(state, {
                loading: {
                    app: { $set: false },
                },
                user: {
                    isAuthorized: { $set: action.isAuthorized },
                }
            } as any);
            case SetTopics.type:
                return update(state, {
                    loading: {
                        topics: { $set: false },
                    },
                    topics: { $set: action.topics },
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