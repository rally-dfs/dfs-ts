import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, } from '@project-serum/anchor';
import { config } from "../../../config";
const { pda: { CANONICAL_MINT_AUTHORITY_PDA_SEED }, accountLayout: { CANONICAL_DATA_SPACE } } = config;
const { PublicKey, SystemProgram: { programId } } = web3;


interface intitializeCanonicalTokenParams {
    canSwap: Program;
    canonicalMint: web3.PublicKey;
    canonicalData: any;
    canonicalAuthority: any
}

export const initializeCanonicalToken = async ({
    canSwap,
    canonicalMint,
    canonicalData,
    canonicalAuthority
} = {} as intitializeCanonicalTokenParams) => {

    try {
        const [expectedMintAuthorityPDA, expectedMintAuthorityBump] =
            await PublicKey.findProgramAddress(
                [CANONICAL_MINT_AUTHORITY_PDA_SEED, canonicalMint.toBuffer()],
                canSwap.programId
            );

        return canSwap.rpc.initializeCanonicalToken(
            expectedMintAuthorityBump,
            {
                accounts: {
                    initializer: canonicalAuthority.publicKey,
                    canonicalMint: canonicalMint,
                    pdaCanonicalMintAuthority: expectedMintAuthorityPDA,
                    canonicalData: canonicalData.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: programId,
                },
                instructions: [
                    await canSwap.account.canonicalData.createInstruction(
                        canonicalData,
                        CANONICAL_DATA_SPACE
                    ),
                ],
                signers: [canonicalData, canonicalAuthority],
            }
        );
    } catch (error) {
        console.log(error)
    }



}