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
TTtqEzeS3rsKwKDgivdCE7fVWEq4M3L88J

<https://nile.tronscan.org/#/token20/TTtqEzeS3rsKwKDgivdCE7fVWEq4M3L88J/code>
