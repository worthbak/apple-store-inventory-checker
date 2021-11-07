# apple-store-inventory-checker
Checks Apple Store inventory for new MacBook Pro models.

### Installation 
Run `npm install` to load the project's dependencies. Assumes recent `node` version (tested with `v17.0.1`, but should work with earlier versions).
* `request` for simplifying network requests
* `node-notifier` for sending local notifications when stock is detected. 

### Running the script
First, find the nearest Apple Store number using [the included table](./apple-store-numbers.md). Then run the script, passing the number as an argument:

```sh
$ node index.js R123
```

This will query Apple's retail inventory for all 2021 MacBook Pro variants that are known to be stocked in-store. `R123` is a store in Nashvile, TN, so that store plus others in the surrouding area will be queried. The results are logged to `stdout`, and if any models are found, a notification will be sent. 

### Polling in the background
You might want this script to run every minute or so, to make sure you don't miss your desired model coming into stock. To run the script repeatedly, add the following line to your `crontab`. You will need to update the entry to point to the script directory on your local, the desired log output file, and your node location (use `which node`).
```sh
*/1 * * * * cd ~/path/to/script/folder/ && /usr/local/bin/node index.js R123 > ~/path/to/desired/log/script_output.log 2>&1
```

### Customization 
This script checks for most known MacBook Pro variants that are currently stocked by Apple Stores, and has some special logic for my personal favorite model (14" M1 Max 32 Core GPU, 64GB RAM, 2TB SSD in both Silver and Space Gray). You may want to tweak the code if you're not interested in the "Ultimate" models.

### Apple Store Query URL Pattern
For reference, here's how Apple's fulfillment API works.

```
GET https://www.apple.com/shop/fulfillment-messages
  ?parts.0=MMQX3LL%2FA  // URL encoded part number MMQX3LL/A
  &parts.1=MKH53LL%2FA  // URL encoded part number MKH53LL/A
  &parts.2=MYD92LL%2FA  // URL encoded part number MYD92LL/A
  ...
  &searchNearby=true    // Instruct the API to search the designated store and the surrounding area
  &store=R172           // Store number (R172 is in Boulder, CO)
```
