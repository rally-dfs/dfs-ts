import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, BN } from '@project-serum/anchor';
import { config } from "../../../config";
import { NodeWallet } from '@metaplex/js';
const { pda: { WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED, TOKEN_ACCOUNT_PDA_SEED, CANONICAL_MINT_AUTHORITY_PDA_SEED } } = config;
const { PublicKey, SystemProgram: { programId } } = web3;

interface swapCanonicalForWrappedParams {
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

export const swapCanonicalForWrapped = async ({
    canSwap,
    canonicalMint,
    wrappedMint,
    canonicalData,
    wrappedData,
    sourceTokenAccount,
    destinationTokenAccount,
    destinationAmount,
    wallet

} = {} as swapCanonicalForWrappedParams) => {

    const [wrappedTokenAccount] = await PublicKey.findProgramAddress(
        [TOKEN_ACCOUNT_PDA_SEED, canonicalMint.toBuffer(), wrappedMint.toBuffer()],
        canSwap.programId
    );

    const [wrappedTokenAccountAuthority, wrappedTokenAccountAuthorityBump] =
        await PublicKey.findProgramAddress(
            [
                WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED,
                canonicalMint.toBuffer(),
                wrappedMint.toBuffer(),
            ],
            canSwap.programId
        );

    return canSwap.rpc.swapCanonicalForWrapped(
        destinationAmount,
        wrappedTokenAccountAuthorityBump,
        {
            accounts: {
                user: wallet.publicKey,
                sourceCanonicalTokenAccount: sourceTokenAccount,
                canonicalMint: canonicalMint,
                destinationWrappedTokenAccount: destinationTokenAccount,
                wrappedTokenAccount,
                pdaWrappedTokenAuthority: wrappedTokenAccountAuthority,
                canonicalData: canonicalData,
                wrappedData: wrappedData,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [wallet.payer],
        }
    );

}