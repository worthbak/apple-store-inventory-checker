const request = require("request");
const notifier = require("node-notifier");

const { SKUS, SKUS_AUSTRALIA, COUNTRIES } = require("./constants");
const args = process.argv.slice(2);

let favorites = ["MMQX3LL/A", "MKH53LL/A", "MK1A3LL/A", "MK1H3LL/A"];
// Australia uses different SKUs, if passing in AU as the country code,
// this favorites list will be used instead of the default
let favoritesAustralia = ["MMQX3X/A","MKH53X/A","MMQW3X/A","MK233X/A"];

const control = "MYD92LL/A";
let storeNumber = "R172";
let state = "CO";
let countryCode = "";
let skuList = SKUS;

if (args.length > 0) {
  const passedStore = args[0];
  const passedCountry = args[1] ?? "US";
  if (passedStore.charAt(0) === "R") {
    // All retail store numbers start with R
    storeNumber = passedStore;
    state = null;
  }
  countryCode = COUNTRIES[passedCountry];
  if (countryCode === "/au") {
    skuList = SKUS_AUSTRALIA;
    favorites = favoritesAustralia;
  }
}

const query =
  Object.keys(skuList)
    .map((k, i) => `parts.${i}=${encodeURIComponent(k)}`)
    .join("&") + `&searchNearby=true&store=${storeNumber}`;

let options = {
  method: "GET",
  url: `https://www.apple.com${countryCode}/shop/fulfillment-messages?` + query,
};

request(options, function (error, response) {
  if (error) throw new Error(error);

  const body = JSON.parse(response.body);
  const storesArray = body.body.content.pickupMessage.stores;
  let skuCounter = {};
  let hasStoreSearchError = false;

  console.log('Inventory');
  console.log('---------');
  const statusArray = storesArray
    .flatMap((store) => {
      if (state && state !== store.state) return null;

      const name = store.storeName;
      let productStatus = [];

      for (const [key, value] of Object.entries(skuList)) {
        const product = store.partsAvailability[key];

        hasStoreSearchError = product.storeSearchEnabled !== true;

        if (key === control && hasStoreSearchError !== true) {
          hasStoreSearchError = product.pickupDisplay !== "available";
        } else {
          productStatus.push(`${value}: ${product.pickupDisplay}`);

          if (product.pickupDisplay !== "unavailable") {
            console.log(`${value} in stock at ${store.storeName}`);
            let count = skuCounter[key] ?? 0;
            count += 1;
            skuCounter[key] = count;
          }
        }
      }

      return {
        name: name,
        products: productStatus,
      };
    })
    .filter((n) => n);

  let hasError = hasStoreSearchError;

  const inventory = Object.entries(skuCounter)
    .map(([key, value]) => `${skuList[key]}: ${value}`)
    .join(" | ");

  console.log('\nInventory counts');
  console.log('----------------');
  console.log(inventory.replaceAll(" | ","\n"));
  let hasUltimate = Object.keys(skuCounter).some(
    (r) => favorites.indexOf(r) >= 0
  );
  let notificationMessage;

  if (inventory) {
    notificationMessage = `${
      hasUltimate ? "FOUND ULTIMATE! " : ""
    }Some models found: ${inventory}`;
  } else {
    console.log(statusArray);
    notificationMessage = "No models found.";
  }

  const message = hasError ? "Possible error?" : notificationMessage;
  notifier.notify({
    title: "MacBook Pro Availability",
    message: message,
    sound: hasError || inventory,
    timeout: false,
  });

  // Log time at end
  console.log(`\nGenerated: ${new Date().toLocaleString()}`);
});
