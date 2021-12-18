import * as anchor from "@project-serum/anchor";

export const config = {
    programs: {
        canonicalSwap: 'CNSWAP9TsKjy3Ux1QxptQS2RFAiP5Eucf4odRHueNwzm',
        token: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    },
    pda: {
        canonicalMintAuthoritySeed: anchor.utils.bytes.utf8.encode("can_mint_authority"),
        tokenAccountSeed: anchor.utils.bytes.utf8.encode("token_account_seed")
    }
};