import { config } from "../../config"
import { Program, web3, BN } from '@project-serum/anchor';

const { accountLayout: { SWAP_ACCOUNT_SPACE } } = config;


export const getOrCreateAssociatedAccount = async (token, pubKey) => {

    const accountInfo = await token.getOrCreateAssociatedAccountInfo(pubKey);
    return accountInfo.address;

}

export const createSwapInfoAccount = async (provider, fromPubkey, programId) => {
    // Generate new keypair

    const newAccount = web3.Keypair.generate();


    // Create account transaction.
    const tx = new web3.Transaction();
    tx.add(
        web3.SystemProgram.createAccount({
            fromPubkey: fromPubkey,
            newAccountPubkey: newAccount.publicKey,
            space: SWAP_ACCOUNT_SPACE,
            lamports: await provider.connection.getMinimumBalanceForRentExemption(SWAP_ACCOUNT_SPACE),
            programId
        })
    );
    await provider.send(tx, [newAccount]);

    return newAccount;
}