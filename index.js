var request = require('request');
const notifier = require('node-notifier');

var options = {
  'method': 'GET',
  'url': 'https://www.apple.com/shop/fulfillment-messages?parts.0=MMQX3LL%2FA&parts.1=MKH53LL%2FA&parts.2=MYD92LL%2FA&searchNearby=true&store=R172'
};

request(options, function (error, response) {
  if (error) throw new Error(error);
  const body = JSON.parse(response.body)
  const storesArray = body.body.content.pickupMessage.stores;

  let hasStoreSearchError = false
  const statusArray = storesArray
    .flatMap((store) => {
      const name = store.storeName;
      const state = store.state;

      // only check Colorado stores
      if (state !== 'CO') return null;

      // confirm that each product is eligible for pickup (they all should be)
      const silver = store.partsAvailability["MMQX3LL/A"]
      hasStoreSearchError = silver.storeSearchEnabled !== true;

      const spaceGray = store.partsAvailability["MKH53LL/A"]
      hasStoreSearchError = silver.storeSearchEnabled !== true;

      const control = store.partsAvailability["MYD92LL/A"]
      hasStoreSearchError = silver.storeSearchEnabled !== true;
      
      // should be 'available' or 'unavailable'
      const silverAvailabilityStatus = silver.pickupDisplay;
      const spaceGrayAvailabilityStatus = spaceGray.pickupDisplay;
      const controlAvailabilityStatus = control.pickupDisplay;

      return {
        name: name,
        silver: silverAvailabilityStatus,
        spaceGray: spaceGrayAvailabilityStatus,
        control: controlAvailabilityStatus
      }
    })
    .filter((n) => n) // remove nulls

  let hasError = hasStoreSearchError;
  let storesWithAvailability = [];
  statusArray.forEach((item) => {
    if (item.silver !== 'unavailable') {
      storesWithAvailability.push(item.name);
    }

    if (item.spaceGray !== 'unavailable') {
      storesWithAvailability.push(item.name);
    }

    if (item.control !== 'available') {
      hasError = true;
    }
  })

  storesWithAvailability = [...new Set(storesWithAvailability)];
  console.log(statusArray);

  const message = hasError ? 'Possible error?' : `Available in ${storesWithAvailability.length} store(s). ${storesWithAvailability.join(', ')}`;
  notifier.notify({
    title: 'MacBook Pro 14\" Availability',
    message: message,
    sound: storesWithAvailability.length !== 0,
    timeout: false
  });
});