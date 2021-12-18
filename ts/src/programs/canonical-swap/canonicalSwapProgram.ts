

import * as anchor from "@project-serum/anchor";
import { config } from "../../../config";
const { canonicalSwap } = config.programs;


export const canonicalSwapProgram = async ({ provider, }) => {


    // configure anchor client
    anchor.setProvider(provider);

    // fetch idl

    const idl = JSON.parse(
        require("fs").readFileSync("idl.json", "utf8")
    );

    // get program id from config
    const programId = new anchor.web3.PublicKey(canonicalSwap);

    // return program client
    return new anchor.Program(
        idl,
        programId,
        provider
    )
};