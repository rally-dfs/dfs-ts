# DFS TS

DFS TS is a typescript library that allows you to 1) set up fungible SPL tokens for use in Rally token programs 2) call Rally token programs from browser or node. 

# DFS CLI 

DFS CLI allows you to setup fungilble SPL tokens and call Rally token programs from the command line. 

## create token

`npx ts-node src/token-cli create-token`

```
Usage: token-cli create-token [options]

Options:
  -e, --env <string>     Solana cluster env name (default: "devnet")
  -k, --keypair <path>   Solana wallet location (default: "--keypair not provided")
  -n, --name <string>    token name
  -s, --symbol <string>  token symbol
  -d, --dec <number>     token decimals
  --supply <number>      initial supply
  -h, --help             display help for command

```

## get metadata 

`npx ts-node src/token-cli get-metadata`

```
Usage: token-cli get-metadata [options] <mint>

Arguments:
  mint                  token mint

Options:
  -e, --env <string>    Solana cluster env name (default: "devnet")
  -k, --keypair <path>  Solana wallet location (default: "--keypair not provided")
  -h, --help            display help for command

```

## add metadata to existing spl token

`npx ts-node src/token-cli add-metadata`

```
Usage: token-cli add-metadata [options] <mint>

Arguments:
  mint                   token mint

Options:
  -e, --env <string>     Solana cluster env name (default: "devnet")
  -k, --keypair <path>   Solana wallet location (default: "--keypair not provided")
  -n, --name <string>    token name
  -s, --symbol <string>  token symbol
  -h, --help             display help for command
  ```
