import { createSlice } from '@reduxjs/toolkit'

export interface WalletRecord {
    id: String;
    salt: String;
        data: String;
}
export interface WalletState {
    wallets: WalletRecord[]
}

const initialState: WalletState = {
    wallets: []
}
  

export const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        add: (state, action) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes.
            // Also, no return statement is required from these functions.
            state.wallets.push(action.payload);
        },
        remove: (state, action) => {
            state.wallets.findIndex(wallet => wallet.id === action.payload)
        }
    },
})

export const { add, remove } = walletSlice.actions

export default walletSlice.reducer