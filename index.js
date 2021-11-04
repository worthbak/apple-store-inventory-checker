var request = require('request');
const notifier = require('node-notifier');

var options = {
  'method': 'GET',
  'url': 'https://www.apple.com/shop/fulfillment-messages?parts.0=MKGR3LL%2FA&parts.1=MKGP3LL%2FA&parts.2=MKGT3LL%2FA&parts.3=MKGQ3LL%2FA&parts.4=MMQX3LL%2FA&parts.5=MKH53LL%2FA&parts.6=MK1E3LL%2FA&parts.7=MK183LL%2FA&parts.8=MK1F3LL%2FA&parts.9=MK193LL%2FA&parts.10=MK1H3LL%2FA&parts.11=MK1A3LL%2FA&parts.12=MYD92LL%2FA&searchNearby=true&store=R172'
};

const favoriteSilver = 'MMQX3LL/A'
const favorateSpaceGray = 'MKH53LL/A'
const control = 'MYD92LL/A'

const skus = {
  'MKGR3LL/A': '14\" Si, Base',
  'MKGP3LL/A': '14\" SG, Base',
  'MKGT3LL/A': '14\" Si, Better',
  'MKGQ3LL/A': '14\" SG, Better',
  'MMQX3LL/A': '14\" Si, Ultimate',
  'MKH53LL/A': '14\" SG, Ultimate',
  'MK1E3LL/A': '16\" Si, Base',
  'MK183LL/A': '16\" SG, Base',
  'MK1F3LL/A': '16\" Si, Better',
  'MK193LL/A': '16\" SG, Better',
  'MK1H3LL/A': '16\" Si, Best',
  'MK1A3LL/A': '16\" SG, Best',
  'MYD92LL/A': '13\" Control'
}

request(options, function (error, response) {
  if (error) throw new Error(error);
  const body = JSON.parse(response.body)
  const storesArray = body.body.content.pickupMessage.stores;

  let skuCounter = {}

  let hasStoreSearchError = false
  const statusArray = storesArray
    .flatMap((store) => {
      const name = store.storeName;
      const state = store.state;

      // only check Colorado stores
      if (state !== 'CO') return null;

      let productStatus = []

      for (const [key, value] of Object.entries(skus)) {
        const product = store.partsAvailability[key]
        hasStoreSearchError = product.storeSearchEnabled !== true;

        if (key === control && hasStoreSearchError !== true) {
          hasStoreSearchError = product.pickupDisplay !== 'available'
        } else {
          productStatus.push(`${value}: ${product.pickupDisplay}`)
          if (product.pickupDisplay !== 'unavailable') {
            console.log(`${value} in stock at ${store.storeName}`)
            let count = !!skuCounter[key] ? skuCounter[key] : 0
            count += 1
            skuCounter[key] = count
          }
        }
      }

      return {
        name: name,
        products: productStatus
      }
    })
    .filter((n) => n)

  let hasError = hasStoreSearchError;

  let inventory = []
  for (const [key, value] of Object.entries(skuCounter)) {
    inventory.push(`${skus[key]}: ${value}`)
  }

  let inventoryString = inventory.join()
  console.log(inventoryString);

  let hasUltimate = !!skuCounter[favoriteSilver] || !!skuCounter[favorateSpaceGray]
  let notificationMessage
  if (inventory.length > 0) {
    notificationMessage = `${hasUltimate ? 'FOUND ULTIMATE! ' : ''}Some models found: ${inventoryString}`
  } else {
    console.log(statusArray);
    notificationMessage = 'No models found.'
  }

  const message = hasError ? 'Possible error?' : notificationMessage;
  notifier.notify({
    title: 'MacBook Pro Availability',
    message: message,
    sound: hasError || inventory.length > 0,
    timeout: false
  });

  // Log time at end
  console.log(new Date().toLocaleString('en-US', { timeZone: 'America/Denver' }));
});