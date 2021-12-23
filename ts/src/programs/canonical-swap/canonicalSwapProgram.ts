

import * as anchor from "@project-serum/anchor";
import { config } from "../../../config";
import fs from 'fs';
import path from 'path';
const { canonicalSwap } = config.programs;


export const canonicalSwapProgram = async (provider) => {

    // configure anchor client
    anchor.setProvider(provider);

    // fetch idl

    const idl = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./idl.json"), "utf8"));

    // get program id from config
    const programId = new anchor.web3.PublicKey(canonicalSwap);

    // return program client
    return new anchor.Program(
        idl,
        programId,
        provider
    )
};