
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, BN } from '@project-serum/anchor';
import { NodeWallet } from '@metaplex/js';
import { config } from "../../../config";
const { pda: { canonicalMintAuthoritySeed, tokenAccountSeed } } = config;

interface swapParams {
    swapProgram: Program;
    canonicalMint: web3.PublicKey;
    wrappedMint: web3.PublicKey;
    canonicalData: web3.PublicKey;
    wrappedData: web3.PublicKey,
    sourceTokenAccount: web3.PublicKey,
    destinationTokenAccount: web3.PublicKey,
    destinationAmount: BN,
    wallet: NodeWallet
}

export const swap = async ({
    swapProgram,
    canonicalMint,
    wrappedMint,
    canonicalData,
    wrappedData,
    sourceTokenAccount,
    destinationTokenAccount,
    destinationAmount,
    wallet
} = {} as swapParams) => {

    const { payer } = wallet;

    const [expectedMintAuthorityPDA, expectedMintAuthorityBump] =
        await web3.PublicKey.findProgramAddress(
            [canonicalMintAuthoritySeed, canonicalMint.toBuffer()],
            swapProgram.programId
        );

    const [wrappedTokenAccount] = await web3.PublicKey.findProgramAddress(
        [tokenAccountSeed, canonicalMint.toBuffer(), wrappedMint.toBuffer()],
        swapProgram.programId
    );

    return swapProgram.rpc.swapWrappedForCanonical(
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


