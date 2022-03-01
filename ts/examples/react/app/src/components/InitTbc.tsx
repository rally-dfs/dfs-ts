
import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Button, Grid, TextField, Typography } from '@mui/material';
import BN from 'bn.js';
import { initializeLinearPriceCurve, tokenSwapProgram, getMintInfo } from "../../../../../build/src/index"
import { Wallet } from '@metaplex/js';
import { PublicKey, Keypair, Signer } from '@solana/web3.js';
import { EXPLORER_ROOT, NETWORK } from "../config";
import { Provider, web3 } from '@project-serum/anchor';
import { getAssociatedTokenAddress } from '../utils';
const InitTbc: FC = () => {

    const { connection } = useConnection();
    const wallet = useWallet() as Wallet;
    const provider = new Provider(connection, wallet, {});
    let tokenSwapInfo;

    type defaultTbcValues = {
        slopeNumerator: number,
        slopeDenominator: number,
        initialTokenAPriceNumerator: number,
        initialTokenAPriceDenominator: number,
        initialTokenBLiquidity: number,
        tokenA: string,
        tokenB: string,
        tokenSwapInfo: string,
    }


    const defaultTbcValues = {
        slopeNumerator: 0,
        slopeDenominator: 0,
        initialTokenAPriceNumerator: 0,
        initialTokenAPriceDenominator: 0,
        initialTokenBLiquidity: 0,
        tokenA: "",
        tokenB: "",
    } as defaultTbcValues;

    type initTbcResponse = {
        tx: string | null,
        setupTx: string | null,
        destinationAccount: Keypair | null
    }

    const defaultInitTbcRespondValues = {} as initTbcResponse;


    const [formValues, setFormValues] = useState(defaultTbcValues)
    const [tbcResponseValues, setTbcResponsValues] = useState(defaultInitTbcRespondValues)

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value,
        });
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!wallet.publicKey) {
            console.log("wallet not active")
        } else {
            const {
                slopeNumerator,
                slopeDenominator,
                initialTokenAPriceNumerator,
                initialTokenAPriceDenominator,
                initialTokenBLiquidity,
                tokenA,
                tokenB
            } = formValues;

            //convert init supply to decimal units

            tokenSwapInfo = Keypair.generate();
            setFormValues({
                ...formValues,
                tokenSwapInfo: tokenSwapInfo.publicKey.toBase58()
            })
            const tokenSwap = await tokenSwapProgram(provider);
            const callerTokenBAccount = await getAssociatedTokenAddress(new PublicKey(tokenB), wallet.publicKey)
            const { decimals: tokenBDecimals } = await getMintInfo({ tokenMint: new PublicKey(tokenB), connection });


            const result = await initializeLinearPriceCurve({
                tokenSwap,
                slopeNumerator: new BN(slopeNumerator),
                slopeDenominator: new BN(slopeDenominator),
                initialTokenAPriceNumerator: new BN(initialTokenAPriceNumerator),
                initialTokenAPriceDenominator: new BN(initialTokenAPriceDenominator),
                callerTokenBAccount,
                tokenSwapInfo,
                tokenA: new PublicKey(tokenA),
                tokenB: new PublicKey(tokenB),
                wallet,
                connection,
                initialTokenBLiquidity: new BN(initialTokenBLiquidity * (10 ** Number(tokenBDecimals)))

            })

            setTbcResponsValues(result);
            console.log(result)

        }
    };


    return (
        <>
            <form onSubmit={handleSubmit}>
                <Typography variant="h6" gutterBottom>
                    Initialize Token Bonding Curve
                </Typography>

                <Grid container spacing={3} maxWidth="sm">

                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="tokenA"
                            name="tokenA"
                            label="Token A"
                            value={formValues.tokenA}
                            onChange={handleInputChange}
                            fullWidth
                            variant="standard"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="tokenB"
                            name="tokenB"
                            label="Token B"
                            fullWidth
                            variant="standard"
                            value={formValues.tokenB}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="slopeNumerator"
                            name="slopeNumerator"
                            label="Slope Numerator"
                            fullWidth
                            variant="standard"
                            value={formValues.slopeNumerator}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="slopeDenominiator"
                            name="slopeDenominator"
                            label="Slope Denominator"
                            fullWidth
                            variant="standard"
                            value={formValues.slopeDenominator}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="initialTokenAPriceNumerator"
                            name="initialTokenAPriceNumerator"
                            label="Initial Token A Price Numerator"
                            fullWidth
                            variant="standard"
                            value={formValues.initialTokenAPriceNumerator}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="initialTokenAPriceDenominator"
                            name="initialTokenAPriceDenominator"
                            label="Initial Token A Price Denominator"
                            fullWidth
                            variant="standard"
                            value={formValues.initialTokenAPriceDenominator}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            id="initialTokenBLiquidity"
                            name="initialTokenBLiquidity"
                            label="Initial Token B Liquidity"
                            fullWidth
                            variant="standard"
                            value={formValues.initialTokenBLiquidity}
                            onChange={handleInputChange}
                        />
                    </Grid>
                </Grid>
                <Button variant="contained" color="primary" type="submit">
                    Submit
                </Button>
            </form>
            {
                tbcResponseValues.tx != null && (
                    <Grid container spacing={3} maxWidth="sm">
                        <p>{`token successfully created`}</p>
                        <p>tx id =<a href={`${EXPLORER_ROOT}/tx/${tbcResponseValues.tx}?cluster=${NETWORK}`} target="_blank">{`${tbcResponseValues.tx}`}</a></p>
                        <p>swap id = <a href={`${EXPLORER_ROOT}/address/${formValues.tokenSwapInfo}?cluster=${NETWORK}`} target="_blank">{`${formValues.tokenSwapInfo}`}</a></p>
                    </Grid>

                )
            }
        </>

    );


}

export default InitTbc