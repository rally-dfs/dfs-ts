import {
    tokenSwapProgram,
} from "../src"
import { web3, Provider, BN } from "@project-serum/anchor"
import assert from 'assert';
import { NodeWallet } from "@metaplex/js";
import { initializeLinearPriceCurve, executeSwap } from "../src";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getTokenSwapInfo } from "../src/utils/utils";
const { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, } = web3;

describe('token swap', () => {

    let provider;
    let wallet;
    let connection;
    let tokenA;
    let tokenB;
    let tokenSwapInfo;
    let slopeNumerator;
    let slopeDenominator;
    let initialTokenPriceA;
    let initialTokenPriceB;
    let feeAccount;
    let poolToken;
    let destinationAccount;
    let tokenATokenAccount;
    let tokenBTokenAccount;
    const initialTokenBLiquidity = new BN(500 * 10 ** 8);
    const initialTokenALiquidity = new BN(10000 * 10 ** 8);
    const swapInitAmountTokenA = new BN(2400 * 10 ** 8);
    const decimals = 8

    before(async () => {
        const walletKeyPair = Keypair.generate();
        tokenSwapInfo = Keypair.generate();
        provider = new Provider(new Connection(clusterApiUrl("devnet")), new NodeWallet(walletKeyPair), {});
        //provider = new Provider(new Connection('http://127.0.0.1:8899'), new NodeWallet(walletKeyPair), {});
        ({ connection, wallet } = provider);
        await connection.confirmTransaction(await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL))
    })

    it('it should get an instance of the token swap program', async () => {

        const programName = 'anchor_token_swap'
        const { idl } = await tokenSwapProgram(provider);
        assert.strictEqual(idl.name, programName);

    })

    it('it should initiliaze a linear price curve', async () => {

        const { payer } = wallet

        slopeNumerator = new BN(1);
        slopeDenominator = new BN(200000000);
        initialTokenPriceA = new BN(50);
        initialTokenPriceB = new BN(30000000000);

        tokenA = await Token.createMint(
            connection,
            payer,
            payer.publicKey,
            null,
            decimals,
            TOKEN_PROGRAM_ID
        );

        tokenB = await Token.createMint(
            connection,
            payer,
            payer.publicKey,
            null,
            decimals,
            TOKEN_PROGRAM_ID
        );

        // mint token B to associated token account for caller, this will be transferred to pda token account 

        const callerTokenBAccount = await tokenB.createAssociatedTokenAccount(payer.publicKey);
        await tokenB.mintTo(callerTokenBAccount, payer, [], initialTokenBLiquidity.toNumber());

        const tokenSwap = await tokenSwapProgram(provider);

        const { destinationAccount } = await initializeLinearPriceCurve({
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
        })


        const data = await getTokenSwapInfo(provider, tokenSwapInfo.publicKey, tokenSwap.programId, payer);
        poolToken = new Token(connection, data.poolToken, TOKEN_PROGRAM_ID, payer)
        feeAccount = data.feeAccount;
        tokenATokenAccount = data.tokenAccountA;
        tokenBTokenAccount = data.tokenAccountB;
        const { amount: feeAmount } = await poolToken.getAccountInfo(feeAccount);
        const { amount: destinationAmount } = await poolToken.getAccountInfo(destinationAccount)

        assert.ok(feeAmount.eq(new BN(0)));
        assert.ok(destinationAmount.eq(new BN(10 * 10 ** 8)));

    })

    it('it should execute a swap on a linear price curve', async () => {

        const tokenSwap = await tokenSwapProgram(provider);
        const amountOut = new BN(0)
        const { payer } = wallet

        const callerTokenAAccount = await tokenA.createAccount(payer.publicKey);
        await tokenA.mintTo(callerTokenAAccount, payer, [], initialTokenALiquidity.toNumber());
        const callerTokenBAccount = await tokenB.createAccount(payer.publicKey);

        await executeSwap({
            tokenSwap,
            tokenSwapInfo,
            amountIn: swapInitAmountTokenA,
            amountOut,
            userTransferAuthority: payer.publicKey,
            userSourceTokenAccount: callerTokenAAccount,
            userDestinationTokenAccount: callerTokenBAccount,
            swapSourceTokenAccount: tokenATokenAccount,
            swapDestinationTokenAccount: tokenBTokenAccount,
            poolMintAccount: poolToken.publicKey,
            poolFeeAccount: feeAccount,
            wallet
        })

    })

})



