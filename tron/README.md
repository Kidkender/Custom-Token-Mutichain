Create file env
echo "export PRIVATE_KEY_NILE=YOUR_PRIVATE_KEY" > .env

To compile using cli:

```bash
tronbox compile
```

to deploy:

```bash
source .env && tronbox migrate --network nile
```

To interact with tron you need get api key at "https://tronscan.org/#/myaccount/apiKeys"

Contract test deploy:
TBBwdLDUbUo7hX4YT7BXpDop1uDstMnmFN
<https://nile.tronscan.org/#/transaction/d52d0c75b04842ad601b2ef628be6909557b69ac3b5cf8c3b3b1bd8c3e01b327>
