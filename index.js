const request = require("request");
const notifier = require("node-notifier");

const { SKUS, COUNTRIES } = require("./constants");
const args = process.argv.slice(2);
const favorites = ["MMQX3LL/A", "MKH53LL/A", "MK1A3LL/A", "MK1H3LL/A"];
const control = "MYD92LL/A";
const timeZone = "America/Denver";
let storeNumber = "R172";
let state = "CO";
let countryCode = "";

if (args.length > 0) {
  const passedStore = args[0];
  const passedCountry = args[1] ?? "US";
  if (passedStore.charAt(0) === "R") {
    // All retail store numbers start with R
    storeNumber = passedStore;
    state = null;
  }
  countryCode = COUNTRIES[passedCountry];
}

const query =
  Object.keys(SKUS)
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

  const statusArray = storesArray
    .flatMap((store) => {
      if (state && state !== store.state) return null;

      const name = store.storeName;
      let productStatus = [];

      for (const [key, value] of Object.entries(SKUS)) {
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
    .map(([key, value]) => `${SKUS[key]}: ${value}`)
    .join(" | ");

  console.log(inventory);

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
  console.log(new Date().toLocaleString("en-US", { timeZone }));
});
