import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, } from '@project-serum/anchor';
import { config } from "../../../config";
const { pda: { WRAPPED_TOKEN_OWNER_AUTHORITY_PDA_SEED, TOKEN_ACCOUNT_PDA_SEED } } = config;
const { PublicKey, SystemProgram: { programId } } = web3;

interface initializeWrappedTokenParams {
    canSwap: Program;
    wrappedMint: web3.PublicKey;
    wrappedData: any;
    canonicalMint: web3.PublicKey;
    canonicalData: web3.PublicKey;
    canonicalAuthority: any
}

export const initializeWrappedToken = async ({
    canSwap,
    wrappedMint,
    wrappedData,
    canonicalMint,
    canonicalData,
    canonicalAuthority
} = {} as initializeWrappedTokenParams) => {

    const [wrappedTokenAccount, wrappedTokenAccountBump] =
        await PublicKey.findProgramAddress(
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

    return await canSwap.rpc.initializeWrappedToken(
        wrappedTokenAccountBump,
        wrappedTokenAccountAuthorityBump,
        {
            accounts: {
                currentAuthority: canonicalAuthority.publicKey,
                wrappedTokenMint: wrappedMint,
                pdaWrappedTokenAccount: wrappedTokenAccount,
                pdaWrappedTokenAccountAuthority: wrappedTokenAccountAuthority,
                canonicalData: canonicalData,
                wrappedData: wrappedData.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY,
                systemProgram: programId,
            },
            instructions: [
                await canSwap.account.wrappedData.createInstruction(
                    wrappedData,
                    8 + 66
                ),
            ],
            signers: [wrappedData, canonicalAuthority],
        }
    );

}