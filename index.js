const request = require("request");
const notifier = require("node-notifier");
const { SKUS, SKUS_AUSTRALIA, SKUS_IPHONE, SKUS_AUSTRALIA_IPHONE, COUNTRIES, PRODUCT_TYPES } = require("./constants");

/********** START USER CONFIGURATION ********/

// List of desireable SKUs (for example Ultimate MBP config)
let favorites = ["MMQX3LL/A", "MKH53LL/A", "MK1A3LL/A", "MK1H3LL/A"];

// Australia uses different SKUs, if passing in AU as the country code,
// this favorites list will be used instead of the default
let favoritesAustralia = ["MMQX3X/A","MKH53X/A","MMQW3X/A","MK233X/A"];

// Set this to false for console output only
const sendNotification = true;

// default store
let storeNumber = "R172";

/************ END USER CONFIGURATION ********/

// used for verification of result
const control = "MYD92LL/A"; // MBP M1

const args = process.argv.slice(2);

// All retail store numbers start with R
const passedStore = args.length && args[0].charAt(0) === "R" ? args[0] : storeNumber;

const passedCountry = args[1] ? args[1] : "US";
const passedProductType = args[2] ? args[2] : "MBP";
const title = passedProductType === PRODUCT_TYPES.MBP ? "Macbook Pro" : "iPhone";
let skuList = passedProductType === PRODUCT_TYPES.IPHONE ? SKUS_IPHONE : SKUS;

validateInput(passedCountry,passedProductType);

const countryCode = COUNTRIES[passedCountry];
if (countryCode === "/au") {
  skuList = passedProductType === PRODUCT_TYPES.IPHONE ? SKUS_AUSTRALIA_IPHONE : SKUS_AUSTRALIA;
  favorites = favoritesAustralia;
}

// run the search
queryStore(countryCode,passedStore,skuList,favorites);

// #region Helper Functions

function validateInput(propCountry,propProductType) {
  if (!Object.getOwnPropertyNames(COUNTRIES).includes(propCountry)) {
    console.error("Unrecognised country code");
    console.error(`Recognised codes: ${Object.getOwnPropertyNames(COUNTRIES).join(',')}`);
    process.exit(1);
  }
  if (!Object.getOwnPropertyNames(PRODUCT_TYPES).includes(propProductType)) {
    console.error("Unrecognised product type");
    console.error(`Recognised product types: ${Object.getOwnPropertyNames(PRODUCT_TYPES).join(',')}`);
    process.exit(2);
  }
}

function queryStore(country, storeNumber, skuList, favorites) {
  const query =
    Object.keys(skuList)
      .map((k, i) => `parts.${i}=${encodeURIComponent(k)}`)
      .join("&") + `&searchNearby=true&store=${storeNumber}`;

  let options = {
    method: "GET",
    url: `https://www.apple.com${country}/shop/fulfillment-messages?` + query,
  };

  request(options, (error, response) => {
    if (error) throw new Error(error);

    const body = JSON.parse(response.body);
    const storesArray = body.body.content.pickupMessage.stores;
    let skuCounter = {};
    let hasStoreSearchError = false;

    console.log('Inventory');
    console.log('---------');
    const statusArray = storesArray
      .flatMap((store) => {
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
              let count = skuCounter[key] ? skuCounter[key] : 0;
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

    if (inventory) {
      console.log('\nInventory counts');
      console.log('----------------');
      console.log(inventory.replaceAll(" | ","\n"));
    } else {
      console.log("No models found.");
    }
    
    let hasUltimate = Object.keys(skuCounter).some(
      (r) => favorites.indexOf(r) >= 0
    );
    let notificationMessage;

    if (inventory) {
      notificationMessage = `${
        hasUltimate ? "FOUND ULTIMATE! " : ""
      }Some models found: ${inventory}`;
    } else {
      // uncomment to debug if no results found
      // console.log(statusArray);
      notificationMessage = "No models found.";
    }

    const message = hasError ? "Possible error?" : notificationMessage;
    if (sendNotification) {
      notifier.notify({
        title: `${title} Availability`,
        message: message,
        sound: hasError || inventory,
        timeout: false,
      });
    }
    
    // Log time at end
    console.log(`\nGenerated: ${new Date().toLocaleString()}`);
  });
}

// #endregion
