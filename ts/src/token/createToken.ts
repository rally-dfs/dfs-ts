import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { actions, NodeWallet } from '@metaplex/js';
const { createMetadata } = actions;
import { MetadataDataData } from '@metaplex-foundation/mpl-token-metadata';
import { TokenData } from '../types';
import { BN } from "@project-serum/anchor";



interface createTokenParams {
    initialSupply: BN;
    tokenData: TokenData;
    connection: any;
    wallet: NodeWallet;
}


export const createToken = async ({ initialSupply, tokenData, connection, wallet } = {} as createTokenParams) => {


    // get keypair from provider wallet

    const { payer } = wallet;

    // create token mint 

    const tokenMint = await Token.createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        tokenData.decimals,
        TOKEN_PROGRAM_ID
    );

    //create token account

    const tokenAccount = await tokenMint.createAssociatedTokenAccount(wallet.publicKey);



    // send initial supply to token account

    await tokenMint.mintTo(
        tokenAccount,
        wallet.publicKey,
        [],
        new u64(initialSupply.toString())
    )




    // create metadata obj

    const metadataData = new MetadataDataData({
        name: tokenData.name,
        symbol: tokenData.symbol,
        // values below are only used for NFT metadata
        uri: "",
        sellerFeeBasisPoints: null,
        creators: null,
    });

    // create metadata
    const tx = await createMetadata(
        {
            connection,
            wallet,
            editionMint: tokenMint.publicKey,
            metadataData,
            updateAuthority: payer.publicKey
        }
    )

    // return tx hash, token mint, token account 

    return { tx, tokenMint, tokenAccount }
}

