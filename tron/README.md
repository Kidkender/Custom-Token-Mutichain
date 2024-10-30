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
