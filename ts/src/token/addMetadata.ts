import { Token } from '@solana/spl-token';
import { actions, NodeWallet } from '@metaplex/js';
const { createMetadata } = actions;
import { MetadataDataData } from '@metaplex-foundation/mpl-token-metadata';
import { TokenData } from '../types';


interface addMetadataParams {
    tokenMint: Token;
    tokenData: TokenData;
    connection: any;
    wallet: NodeWallet;
}

export const addMetadata = async ({ tokenMint, tokenData, connection, wallet } = {} as addMetadataParams) => {

    const { payer } = wallet;

    const metadataData = new MetadataDataData({
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: "",
        sellerFeeBasisPoints: null,
        creators: null,
    });

    // create metadata

    return createMetadata(
        {
            connection,
            wallet,
            editionMint: tokenMint.publicKey,
            metadataData,
            updateAuthority: payer.publicKey
        }
    )
}