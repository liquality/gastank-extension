import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export const generateMnemonic: () => string = () => {
    return bip39.generateMnemonic(wordlist);
}

export const validateMnemonic: (mnemonic: string) => boolean = (mnemonic: string) => {
    return bip39.validateMnemonic(mnemonic, wordlist);
}
