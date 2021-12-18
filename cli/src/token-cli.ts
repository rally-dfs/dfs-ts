import { web3 } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { NodeWallet } from '@metaplex/js';
import { program } from 'commander';
program.version('0.0.1');
import { addMetadata, createToken, getMetadata } from "../../ts/src"
import { loadKeypair } from "./utils/utils"
const { Connection, clusterApiUrl } = web3;


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
    .requiredOption('-d, --dec <number>', 'token decimals')
    .requiredOption('--supply <number>', 'initial supply')
    .action(async (options) => {

        // get values from options

        const { env, keypair, name, symbol, dec, supply } = options;

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

// get metadata for fungible token mint

program
    .command('get-metadata')
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
        const { env } = options;

        // connect to cluster and load wallet
        const connection = new Connection(clusterApiUrl(env))
        const data = await getMetadata({ tokenMint: mint, connection })
        console.log(data)
    });


program.parse(process.argv);

