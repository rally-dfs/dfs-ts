import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3, BN } from '@project-serum/anchor';
import { NodeWallet } from '@metaplex/js';

const { PublicKey, SystemProgram: { programId } } = web3;

interface executeSwapParams {
    tokenSwap: Program;
    tokenSwapInfo: any;
    amountIn: BN;
    amountOut: BN;
    userTransferAuthority: web3.PublicKey;
    userSourceTokenAccount: web3.PublicKey;
    userDestinationTokenAccount: web3.PublicKey;
    swapSourceTokenAccount: web3.PublicKey;
    swapDestinationTokenAccount: web3.PublicKey;
    poolMintAccount: web3.PublicKey;
    poolFeeAccount: web3.PublicKey;
    wallet: NodeWallet;
}

export const executeSwap = async ({
    tokenSwap,
    tokenSwapInfo,
    amountIn,
    amountOut,
    userTransferAuthority,
    userSourceTokenAccount,
    userDestinationTokenAccount,
    swapSourceTokenAccount,
    swapDestinationTokenAccount,
    poolMintAccount,
    poolFeeAccount,
    wallet

} = {} as executeSwapParams) => {

    const { payer } = wallet;

    // get exepcted swap authority PDA

    const [expectedSwapAuthorityPDA] =
        await PublicKey.findProgramAddress(
            [tokenSwapInfo.publicKey.toBuffer()],
            tokenSwap.programId
        );

    return tokenSwap.rpc.swap(
        amountIn,
        amountOut,
        {
            accounts: {
                tokenSwap: tokenSwapInfo.publicKey,
                swapAuthority: expectedSwapAuthorityPDA,
                userTransferAuthority,
                source: userSourceTokenAccount,
                destination: userDestinationTokenAccount,
                swapSource: swapSourceTokenAccount,
                swapDestination: swapDestinationTokenAccount,
                poolMint: poolMintAccount,
                poolFee: poolFeeAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [payer]
        },
    )


}