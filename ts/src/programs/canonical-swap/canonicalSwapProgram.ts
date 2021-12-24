

import * as anchor from "@project-serum/anchor";
import idl from './idl.json';

import { config } from "../../../config";
import fs from 'fs';
import path from 'path';
const { canonicalSwap } = config.programs;


export const canonicalSwapProgram = async (provider) => {

    // configure anchor client
    anchor.setProvider(provider);

    // get program id from config
    const programId = new anchor.web3.PublicKey(canonicalSwap);

    // return program client
    return new anchor.Program(
        idl as anchor.Idl,
        programId,
        provider
    )
};