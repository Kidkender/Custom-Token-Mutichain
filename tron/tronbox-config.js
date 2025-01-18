module.exports = {
  networks: {
    nile: {
      privateKey: process.env.PRIVATE_KEY_NILE,
      fullHost: "https://nile.trongrid.io",
    },
    shasta: {
      privateKey: process.env.PRIVATE_KEY_SHASTA,
    },
  },
};
