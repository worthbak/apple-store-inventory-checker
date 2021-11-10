const COUNTRIES = {
  US: {
    "storePath": "",
    "skuCode": "LL",
  },
  CA: {
    "storePath": "/ca",
    "skuCode": "LL",
  },
  AU: {
    "storePath": "/au",
    "skuCode": "X",
  },
  DE: {
    "storePath": "/de",
    "skuCode": "D",
  },
  UK: {
    "storePath": "/uk",
    "skuCode": "B",
  },
  KR: { // South Korean Apple Stores do not appear to support in-store pickup
    "storePath": "/kr",
    "skuCode": "KH",
  },
  HK: {
    "storePath": "/hk",
    "skuCode": "ZP",
  },
};

module.exports = {
  COUNTRIES: COUNTRIES,
};
