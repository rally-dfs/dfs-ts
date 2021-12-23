#! /usr/bin/env node

import { web3, BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { NodeWallet } from '@metaplex/js';
import { program } from 'commander';
program.version('0.0.1');
import {
    addMetadata,
    canonicalSwapProgram,
    createToken,
    getMetadata,
    getMintInfo,
    swapWrappedForCanonical,
    swapCanonicalForWrapped
} from "../../ts/src"
import { loadKeypair, getProvider } from "./utils/utils"
const { Connection, clusterApiUrl, Keypair, PublicKey } = web3;

const canonicalMint = new PublicKey(
    "RLYv2ubRMDLcGG2UyvPmnPmkfuQTsMbg4Jtygc7dmnq"
);

const canonicalData = new PublicKey(
    "4wkz5UF7ziY3Kuz1vxkZBakcZrRoTfup4XPASdhDfnpk"
);

const wormholeMint = new PublicKey(
    "6Y7LNYkHiJHSH8zR2HvZQzXD3QA9yFw64tyMHxBxDRe4"
);

const wormholeData = new PublicKey(
    "BuvUZWrTnrBkacCikXsoGW1zA1yMt7D1okq3ZDJrDft8"
);



const ten = new BN(10);

// create fungible SPL token with metadata + initial supply


program
    .command('create-token')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .requiredOption('-n, --name <string>', 'token name')
    .requiredOption('-s, --symbol <string>', 'token symbol')
    .option('-d, --dec <number>', 'token decimals', '9')
    .requiredOption('--supply <number>', 'initial supply (integer value)')
    .action(async (options) => {

        // get values from options

        const { env, keypair, name, symbol } = options;
        let { supply, dec } = options;
        const ten = new BN(10)
        dec = new BN(dec)
        supply = new BN(supply)

        //convert to decimal units
        supply = supply.mul(ten.pow(dec))

        // connect to cluster and load wallet
        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        // create token
        const { tx, tokenMint, tokenAccount } = await createToken({
            initialSupply: supply,
            tokenData: { name, symbol, decimals: dec },
            connection,
            wallet
        })


        // wait for tx confirmation
        await connection.confirmTransaction(tx)

        console.log(`${name} created, token mint = ${tokenMint.publicKey}, associated token account = ${tokenAccount}`)
    });


// add metadata to existing fungible token mint 

program
    .command('add-metadata')
    .argument('<mint>', 'token mint')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .requiredOption('-n, --name <string>', 'token name')
    .requiredOption('-s, --symbol <string>', 'token symbol')
    .action(async (mint, options) => {

        // get values from options
        const { env, keypair, name, symbol } = options;

        // connect to cluster and load wallet
        const connection = new Connection(clusterApiUrl(env))
        const wallet = new NodeWallet(loadKeypair(keypair))

        // init token instance
        const tokenMint = new Token(connection, mint, TOKEN_PROGRAM_ID, keypair);

        //add metdata to token
        const tx = await addMetadata({
            tokenMint,
            tokenData: { name, symbol, decimals: null },
            connection,
            wallet
        })

        console.log(`metadata successfully added to ${mint}`)

    });

// get token info and metadata

program
    .command('get-token-info')
    .argument('<mint>', 'token mint')
    .option(
        '-e, --env <string>',
        'Solana cluster env name',
        'devnet',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (mint, options) => {

        // get values from options

        const { env } = options;

        // connect to cluster and load wallet
        const connection = new Connection(clusterApiUrl(env))
        const mintInfo = await getMintInfo({ tokenMint: mint, connection })
        const data = await getMetadata({ tokenMint: mint, connection })
        console.log({ ...mintInfo, ...data })
    });



program
    .command('get-balance-canonical')
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (options) => {

        const { keypair } = options;
        const { wallet, connection } = getProvider(keypair, 'mainnet-beta')

        //decimals of destination-

        const canv1 = new Token(connection, canonicalMint, TOKEN_PROGRAM_ID, wallet.payer);
        const { decimals } = await canv1.getMintInfo()
        const associatedTokenAcct = await canv1.getOrCreateAssociatedAccountInfo(wallet.publicKey);
        const { amount } = await canv1.getAccountInfo(associatedTokenAcct.address);

        console.log(amount.toNumber())

        console.log(`balance = ${amount.div(ten.pow(new BN(decimals))).toNumber()} in ${associatedTokenAcct.address}`);

    });


program
    .command('get-balance-wormhole')
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async (options) => {

        const { keypair } = options;
        const { wallet, connection } = getProvider(keypair, 'mainnet-beta')

        const whv2 = new Token(connection, wormholeMint, TOKEN_PROGRAM_ID, wallet.payer);
        const { decimals } = await whv2.getMintInfo()
        const associatedTokenAcct = await whv2.getOrCreateAssociatedAccountInfo(wallet.publicKey);
        const { amount } = await whv2.getAccountInfo(associatedTokenAcct.address);
        console.log(`balance = ${amount.div(ten.pow(new BN(decimals))).toNumber()} in ${associatedTokenAcct.address}`);

    });


program
    .command('swap-canonical-wormhole')
    .option(
        '-a, --amount <string>',
        'amount',
    )
    .option(
        '-w, --wormhole_token_account <string>',
        'destination account',
    )
    .option(
        '-c, --canonical_token_account <string>',
        'destination account',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async options => {

        const { env, keypair, wormhole_token_account, canonical_token_account } = options;
        let { amount } = options;
        const { provider, wallet, connection } = getProvider(keypair, 'mainnet-beta')
        const canSwap = await canonicalSwapProgram(provider);


        let { decimals } = await canSwap.account.wrappedData.fetch(wormholeData)

        const ten = new BN(10)
        decimals = new BN(decimals)
        amount = new BN(amount)

        //convert to decimal units
        amount = amount.mul(ten.pow(decimals))

        //decimals of destination-

        const wormholeToken = new Token(connection, wormholeMint, TOKEN_PROGRAM_ID, wallet.payer)
        const canonicalToken = new Token(connection, canonicalMint, TOKEN_PROGRAM_ID, wallet.payer)

        const wormholeTokenAccount = wormhole_token_account ? new PublicKey(wormhole_token_account) : await wormholeToken.createAssociatedTokenAccount(wallet.payer.publicKey);
        const canonicalTokenAccount = canonical_token_account ? new PublicKey(canonical_token_account) : await canonicalToken.createAssociatedTokenAccount(wallet.payer.publicKey);


        const tx = await swapCanonicalForWrapped({
            canSwap,
            canonicalMint: canonicalMint,
            wrappedMint: wormholeMint,
            canonicalData: canonicalData,
            wrappedData: wormholeData,
            sourceTokenAccount: canonicalTokenAccount,
            destinationTokenAccount: wormholeTokenAccount,
            destinationAmount: amount,
            wallet
        })

        await connection.confirmTransaction(tx)

        console.log(`${amount.div(ten.pow(decimals)).toNumber()} of ${canonicalMint} swapped for ${wormholeMint} sent to ${wormholeTokenAccount.toBase58()}`)

    });


program
    .command('swap-wormhole-canonical')
    .option(
        '-a, --amount <string>',
        'amount',
    )
    .option(
        '-w, --wormhole_token_account <string>',
        'destination account',
    )
    .option(
        '-c, --canonical_token_account <string>',
        'destination account',
    )
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async options => {

        const { env, keypair, wormhole_token_account, canonical_token_account } = options;
        let { amount } = options;
        const { provider, wallet, connection } = getProvider(keypair, 'mainnet-beta')
        const canSwap = await canonicalSwapProgram(provider);


        let { decimals } = await canSwap.account.canonicalData.fetch(canonicalData)

        const ten = new BN(10)
        decimals = new BN(decimals)
        amount = new BN(amount)

        //convert to decimal units
        amount = amount.mul(ten.pow(decimals))

        //decimals of destination-

        const wormholeToken = new Token(connection, wormholeMint, TOKEN_PROGRAM_ID, wallet.payer)
        const canonicalToken = new Token(connection, canonicalMint, TOKEN_PROGRAM_ID, wallet.payer)

        const wormholeTokenAccount = wormhole_token_account ? new PublicKey(wormhole_token_account) : await wormholeToken.createAssociatedTokenAccount(wallet.payer.publicKey);
        const canonicalTokenAccount = canonical_token_account ? new PublicKey(canonical_token_account) : await canonicalToken.createAssociatedTokenAccount(wallet.payer.publicKey);


        const tx = await swapWrappedForCanonical({
            canSwap,
            canonicalMint: canonicalMint,
            wrappedMint: wormholeMint,
            canonicalData: canonicalData,
            wrappedData: wormholeData,
            sourceTokenAccount: wormholeTokenAccount,
            destinationTokenAccount: canonicalTokenAccount,
            destinationAmount: amount,
            wallet
        })

        await connection.confirmTransaction(tx)

        console.log(`${amount.div(ten.pow(decimals)).toNumber()} of ${canonicalMint} swapped for ${wormholeMint} sent to ${wormholeTokenAccount.toBase58()}`)

    });




program
    .command('init-tbc')
    .requiredOption(
        '-k, --keypair <path>',
        `Solana wallet location`,
        '--keypair not provided',
    )
    .action(async options => {

        console.log("coming soon!")

    });

program.parse(process.argv);

