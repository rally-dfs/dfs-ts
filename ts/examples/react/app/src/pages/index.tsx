import * as React from 'react';
import type { NextPage } from 'next'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { AppBar, Toolbar, Typography, Link, Button, GlobalStyles, CssBaseline, Container } from '@mui/material';

import CreateToken from '../components/CreateToken'
import InitTbc from '../components/InitTbc';
import ExecuteTbcSwap from '../components/ExecuteTbcSwap';


const Home: NextPage = () => {
  return (
    <React.Fragment>

      <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: 'none' } }} />
      <CssBaseline />
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            RLY Network Test App
          </Typography>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>

      <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
        <Typography variant="h5" align="center" color="text.secondary" component="p">
          Below are examples of react components that execute core functionality on the RLY Network Solana programs. Create two tokens, initialize a bonding curve and swap the tokens.
        </Typography>
      </Container>
      <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
        <CreateToken />
      </Container >
      <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
        <InitTbc />
      </Container>
      <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
        <ExecuteTbcSwap />
      </Container>
    </React.Fragment>
  )
}

export default Home
