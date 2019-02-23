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
    topics: Topic[],
    users: User[],
    activities: Activity[],
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
    users: [],
    activities: [],
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

export const SetUsers = CreateAction("SetUsers", props<{
    users: User[] 
}>());

export const SetActivities = CreateAction("SetActivities", props<{
    activities: Activity[] 
}>());


type Action = typeof SetUserData.action 
    | typeof SetIsAuthorized.action
    | typeof SetTopics.action
    | typeof SetActivities.action
    | typeof SetUsers.action

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
        case SetUsers.type:
            return update(state, {
                users: { $set: action.users },
            } as any);
        case SetActivities.type:
            return update(state, {
                activities: { $set: action.activities },
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