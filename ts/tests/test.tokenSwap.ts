import {
    tokenSwapProgram,
    createToken
} from "../src"
import { web3, Provider, BN } from "@project-serum/anchor"
import assert from 'assert';
import { NodeWallet } from "@metaplex/js";
import { initializeLinearPriceCurve } from "../src/programs/token-swap/initializeLinearPriceCurve";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
    const initialTokenSupplyA = new BN(500 * 10 ** 8);
    const initialTokenBSupply = new BN(500 * 10 ** 8);
    const tokenAName = "tokenA";
    const tokenASymbol = "TKNA";
    const tokenBName = "tokenB";
    const tokenBSymbol = "TKNB";
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

        const tokenB = await Token.createMint(
            connection,
            payer,
            payer.publicKey,
            null,
            decimals,
            TOKEN_PROGRAM_ID
        );

        const tokenSwap = await tokenSwapProgram(provider);

        const { poolToken, feeAccount, destinationAccount } = await initializeLinearPriceCurve({
            tokenSwap,
            slopeNumerator,
            slopeDenominator,
            initialTokenPriceA,
            initialTokenPriceB,
            tokenSwapInfo,
            tokenA,
            tokenB,
            wallet,
            provider,
            initialTokenBSupply
        })

        const { amount: feeAmount } = await poolToken.getAccountInfo(feeAccount);
        const { amount: destinationAmount } = await poolToken.getAccountInfo(destinationAccount)

        assert.ok(feeAmount.eq(new BN(0)));
        assert.ok(destinationAmount.eq(new BN(10 * 10 ** 8)));

    })

})



