import { config } from "../../config"
import { Program, web3, BN } from '@project-serum/anchor';
import * as BufferLayout from "@solana/buffer-layout";
import { u64, AccountLayout } from "@solana/spl-token";
const { PublicKey } = web3;


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


const publicKeyLayout = (property: string = 'publicKey'): any => {
    return BufferLayout.blob(32, property);
};

const uint64Layout = (property: string = 'uint64'): any => {
    return BufferLayout.blob(8, property);
};

const loadAccount = async (connection, address, programId) => {
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo === null) {
        throw new Error('Failed to find account');
    }

    if (!accountInfo.owner.equals(programId)) {
        throw new Error(`Invalid owner: ${JSON.stringify(accountInfo.owner)}`);
    }
    return Buffer.from(accountInfo.data);
}

const TokenSwapLayout = BufferLayout.struct([
    BufferLayout.u8('version'),
    BufferLayout.u8('isInitialized'),
    BufferLayout.u8('bumpSeed'),
    publicKeyLayout('tokenProgramId'),
    publicKeyLayout('tokenAccountA'),
    publicKeyLayout('tokenAccountB'),
    publicKeyLayout('tokenPool'),
    publicKeyLayout('mintA'),
    publicKeyLayout('mintB'),
    publicKeyLayout('feeAccount'),
    uint64Layout('tradeFeeNumerator'),
    uint64Layout('tradeFeeDenominator'),
    uint64Layout('ownerTradeFeeNumerator'),
    uint64Layout('ownerTradeFeeDenominator'),
    uint64Layout('ownerWithdrawFeeNumerator'),
    uint64Layout('ownerWithdrawFeeDenominator'),
    uint64Layout('hostFeeNumerator'),
    uint64Layout('hostFeeDenominator'),
    BufferLayout.u8('curveType'),
    BufferLayout.blob(32, 'curveParameters'),
]);

class Numberu64 extends BN {

    toBuffer(): Buffer {
        const a = super.toArray().reverse();
        const b = Buffer.from(a);
        if (b.length === 8) {
            return b;
        }

        const zeroPad = Buffer.alloc(8);
        b.copy(zeroPad);
        return zeroPad;
    }

    static fromBuffer(buffer: Buffer): Numberu64 {
        return new Numberu64(
            [...buffer]
                .reverse()
                .map(i => `00${i.toString(16)}`.slice(-2))
                .join(''),
            16,
        );
    }
}

export const accountInfoFromSim = async (account) => {

    let data = account.data;
    data = Buffer.from(data[0], data[1]);
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);
    return accountInfo;

}

export const getTokenSwapInfo = async (provider, swapInfoPubKey, programId, payer) => {

    const data = await loadAccount(provider.connection, swapInfoPubKey, programId);
    const tokenSwapData = TokenSwapLayout.decode(data);
    if (!tokenSwapData.isInitialized) {
        throw new Error(`Invalid token swap state`);
    }

    if (!tokenSwapData.isInitialized) {
        throw new Error(`Invalid token swap state`);
    }

    const [authority] = await PublicKey.findProgramAddress(
        [swapInfoPubKey.toBuffer()],
        programId,
    );

    const poolToken = new PublicKey(tokenSwapData.tokenPool);
    const feeAccount = new PublicKey(tokenSwapData.feeAccount);
    const tokenAccountA = new PublicKey(tokenSwapData.tokenAccountA);
    const tokenAccountB = new PublicKey(tokenSwapData.tokenAccountB);
    const mintA = new PublicKey(tokenSwapData.mintA);
    const mintB = new PublicKey(tokenSwapData.mintB);
    const tokenProgramId = new PublicKey(tokenSwapData.tokenProgramId);

    const tradeFeeNumerator = Numberu64.fromBuffer(
        tokenSwapData.tradeFeeNumerator,
    );
    const tradeFeeDenominator = Numberu64.fromBuffer(
        tokenSwapData.tradeFeeDenominator,
    );
    const ownerTradeFeeNumerator = Numberu64.fromBuffer(
        tokenSwapData.ownerTradeFeeNumerator,
    );
    const ownerTradeFeeDenominator = Numberu64.fromBuffer(
        tokenSwapData.ownerTradeFeeDenominator,
    );
    const ownerWithdrawFeeNumerator = Numberu64.fromBuffer(
        tokenSwapData.ownerWithdrawFeeNumerator,
    );
    const ownerWithdrawFeeDenominator = Numberu64.fromBuffer(
        tokenSwapData.ownerWithdrawFeeDenominator,
    );
    const hostFeeNumerator = Numberu64.fromBuffer(
        tokenSwapData.hostFeeNumerator,
    );
    const hostFeeDenominator = Numberu64.fromBuffer(
        tokenSwapData.hostFeeDenominator,
    );
    const curveType = tokenSwapData.curveType;

    return {
        programId,
        tokenProgramId,
        poolToken,
        feeAccount,
        authority,
        tokenAccountA,
        tokenAccountB,
        mintA,
        mintB,
        tradeFeeNumerator,
        tradeFeeDenominator,
        ownerTradeFeeNumerator,
        ownerTradeFeeDenominator,
        ownerWithdrawFeeNumerator,
        ownerWithdrawFeeDenominator,
        hostFeeNumerator,
        hostFeeDenominator,
        curveType,
    }
}

