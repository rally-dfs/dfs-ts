import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, BN } from '@project-serum/anchor';
import { config } from "../../../config";
import { NodeWallet } from '@metaplex/js';
import { AnyPublicKey } from '@metaplex-foundation/mpl-core';

const { accountLayout: { SWAP_ACCOUNT_SPACE } } = config;

const { PublicKey, SystemProgram: { programId } } = web3;

interface initializeLinearPriceCurveParams {
    tokenSwap: Program;
    slopeNumerator: BN;
    slopeDenominator: BN;
    initialTokenPriceA: BN;
    initialTokenPriceB: BN;
    callerTokenBAccount: web3.PublicKey;
    tokenSwapInfo: any;
    tokenA: Token;
    tokenB: Token;
    wallet: NodeWallet;
    provider: any;
    initialTokenBLiquidity: BN;
}

export const initializeLinearPriceCurve = async ({
    tokenSwap,
    slopeNumerator,
    slopeDenominator,
    initialTokenPriceA,
    initialTokenPriceB,
    callerTokenBAccount,
    tokenSwapInfo,
    tokenA,
    tokenB,
    wallet,
    provider,
    initialTokenBLiquidity

} = {} as initializeLinearPriceCurveParams) => {

    const { payer } = wallet;


    // get exepcted swap authority PDA

    const [expectedSwapAuthorityPDA] =
        await PublicKey.findProgramAddress(
            [tokenSwapInfo.publicKey.toBuffer()],
            tokenSwap.programId
        );

    // create pooltoken Mint
    const poolToken = await Token.createMint(
        provider.connection,
        payer,
        expectedSwapAuthorityPDA,
        null,
        8,
        TOKEN_PROGRAM_ID
    );

    // create token accounts for swap pda

    const tokenATokenAccount = await tokenA.createAccount(expectedSwapAuthorityPDA);

    const tokenBTokenAccount = await tokenB.createAccount(expectedSwapAuthorityPDA);

    // transfer tokens from caller to pda owned token account
    await tokenB.transfer(callerTokenBAccount, tokenBTokenAccount, payer, [], initialTokenBLiquidity.toNumber())

    // create token accounts for fees and pool tokens owned by calling account (can't use associated token account as two accounts req'd)

    const feeAccount = await poolToken.createAccount(payer.publicKey);
    const destinationAccount = await poolToken.createAccount(payer.publicKey);

    const tx = await tokenSwap.rpc.initializeLinearPrice(
        slopeNumerator,
        slopeDenominator,
        initialTokenPriceA,
        initialTokenPriceB,
        {
            accounts: {
                tokenSwap: tokenSwapInfo.publicKey,
                swapAuthority: expectedSwapAuthorityPDA,
                tokenA: tokenATokenAccount,
                tokenB: tokenBTokenAccount,
                pool: poolToken.publicKey,
                fee: feeAccount,
                destination: destinationAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            //TODO: replace this with anchor program account client instruction generation
            instructions: [
                web3.SystemProgram.createAccount({
                    fromPubkey: payer.publicKey,
                    newAccountPubkey: tokenSwapInfo.publicKey,
                    space: SWAP_ACCOUNT_SPACE,
                    lamports: await provider.connection.getMinimumBalanceForRentExemption(
                        SWAP_ACCOUNT_SPACE
                    ),
                    programId: tokenSwap.programId
                })
            ],
            signers: [payer, tokenSwapInfo],
        }
    );

    return {
        tx,
        poolToken,
        feeAccount,
        destinationAccount,
        tokenATokenAccount,
        tokenBTokenAccount
    }

}