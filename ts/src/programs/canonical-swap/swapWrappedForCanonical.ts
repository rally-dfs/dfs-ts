
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, BN } from '@project-serum/anchor';
import { NodeWallet } from '@metaplex/js';
import { config } from "../../../config";
const { pda: { CANONICAL_MINT_AUTHORITY_PDA_SEED, TOKEN_ACCOUNT_PDA_SEED } } = config;

interface swapWrappedForCanonicalParams {
    canSwap: Program;
    canonicalMint: web3.PublicKey;
    wrappedMint: web3.PublicKey;
    canonicalData: web3.PublicKey;
    wrappedData: web3.PublicKey,
    sourceTokenAccount: web3.PublicKey,
    destinationTokenAccount: web3.PublicKey,
    destinationAmount: BN,
    wallet: NodeWallet
}

export const swapWrappedForCanonical = async ({
    canSwap,
    canonicalMint,
    wrappedMint,
    canonicalData,
    wrappedData,
    sourceTokenAccount,
    destinationTokenAccount,
    destinationAmount,
    wallet
} = {} as swapWrappedForCanonicalParams) => {

    const { payer } = wallet;

    const [expectedMintAuthorityPDA, expectedMintAuthorityBump] =
        await web3.PublicKey.findProgramAddress(
            [CANONICAL_MINT_AUTHORITY_PDA_SEED, canonicalMint.toBuffer()],
            canSwap.programId
        );

    const [wrappedTokenAccount] = await web3.PublicKey.findProgramAddress(
        [TOKEN_ACCOUNT_PDA_SEED, canonicalMint.toBuffer(), wrappedMint.toBuffer()],
        canSwap.programId
    );

    return canSwap.rpc.swapWrappedForCanonical(
        destinationAmount,
        expectedMintAuthorityBump,
        {
            accounts: {
                user: wallet.publicKey,
                destinationCanonicalTokenAccount: destinationTokenAccount,
                canonicalMint: canonicalMint,
                pdaCanonicalMintAuthority: expectedMintAuthorityPDA,
                sourceWrappedTokenAccount: sourceTokenAccount,
                wrappedTokenAccount,
                canonicalData: canonicalData,
                wrappedData: wrappedData,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [payer],
        }
    );

}


