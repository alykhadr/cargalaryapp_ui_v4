import { ActionReducer, ActionReducerMap, INIT, MetaReducer, UPDATE } from "@ngrx/store";
import { LayoutState, layoutReducer } from "./layouts/layout-reducers";
import { EcommerceState, ecommercerReducer } from "./Ecommerce/ecommerce_reducer";
import { ProjectReducer, ProjectState } from "./Project/project_reducer";
import { TaskReducer, TaskState } from "./Task/task_reducer";
import { CRMReducer, CRMState } from "./CRM/crm_reducer";
import { CryptoReducer, CryptoState } from "./Crypto/crypto_reducer";
import { InvoiceReducer, InvoiceState } from "./Invoice/invoice_reducer";
import { TicketReducer, TicketState } from "./Ticket/ticket_reducer";
import { FileManagerReducer, FileManagerState } from "./File Manager/filemanager_reducer";
import { TodoReducer, TodoState } from "./Todo/todo_reducer";
import { ApplicationReducer, ApplicationState } from "./Jobs/jobs_reducer";
import { ApikeyReducer, ApikeyState } from "./APIKey/apikey_reducer";
// import { authenticationReducer, AuthenticationState } from "./Authentication/authentication.reducer";
import { initialState as defaultLayoutState } from "./layouts/layout-reducers";

export interface RootReducerState {
    layout: LayoutState;
    Ecommerce: EcommerceState;
    Project: ProjectState;
    Task: TaskState;
    CRM: CRMState;
    Crypto: CryptoState;
    Invoice: InvoiceState;
    Ticket: TicketState;
    FileManager: FileManagerState;
    Todo: TodoState;
    Jobs: ApplicationState;
    APIKey: ApikeyState;
    // authentication: AuthenticationState;
}

export const rootReducer: ActionReducerMap<RootReducerState> = {
    layout: layoutReducer,
    Ecommerce: ecommercerReducer,
    Project: ProjectReducer,
    Task: TaskReducer,
    CRM: CRMReducer,
    Crypto: CryptoReducer,
    Invoice: InvoiceReducer,
    Ticket: TicketReducer,
    FileManager: FileManagerReducer,
    Todo: TodoReducer,
    Jobs: ApplicationReducer,
    APIKey: ApikeyReducer,
    // authentication: authenticationReducer,

}

const LAYOUT_STORAGE_KEY = 'app.layout.settings';

const isBrowser = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

const getStoredLayout = (): Partial<LayoutState> | null => {
    if (!isBrowser()) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const allowedKeys = Object.keys(defaultLayoutState) as (keyof LayoutState)[];
        const hydrated: Partial<LayoutState> = {};

        for (const key of allowedKeys) {
            const value = parsed[key];
            if (typeof value === 'string') {
                hydrated[key] = value;
            }
        }

        return hydrated;
    } catch {
        return null;
    }
};

const saveLayout = (layout: LayoutState): void => {
    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
        // Ignore storage errors (private mode/quota).
    }
};

export function layoutHydrationMetaReducer(
    reducer: ActionReducer<RootReducerState>
): ActionReducer<RootReducerState> {
    return (state, action) => {
        if (action.type === INIT || action.type === UPDATE) {
            const storedLayout = getStoredLayout();
            if (storedLayout) {
                state = {
                    ...state,
                    layout: {
                        ...defaultLayoutState,
                        ...storedLayout
                    }
                } as RootReducerState;
            }
        }

        const nextState = reducer(state, action);
        if (nextState?.layout) {
            saveLayout(nextState.layout);
        }

        return nextState;
    };
}

export const metaReducers: MetaReducer<RootReducerState>[] = [layoutHydrationMetaReducer];
