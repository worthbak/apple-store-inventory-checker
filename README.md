# apple-store-inventory-checker
Checks Apple Store inventory (for 14" MacBook Pro)

### Using the script
1. Run `npm install` to load the project's dependencies (`request` for simplifying network requests, and `node-notifier` for sending local notifications when stock is detected). 
2. Execute `node index.js` to run the script once. 
3. To run the script repeatedly, add the following line to your `crontab`. You will need to update the entry to point to the script directory on your local, the desired log output file, and your node location (use `which node`)/ 
```
*/1 * * * * cd ~/path/to/script/folder/ && /usr/local/bin/node index.js > ~/path/to/desired/log/script_output.log 2>&1
```

### Customization 
This script checks for most known MacBook Pro variants that are currently stocked by Apple Stores, and has some special logic for my personal favorite model (14" M1 Max 32 Core GPU, 64GB RAM, 2TB SSD in both Silver and Space Gray). If models are found in-stock, a notification will appear listing the stocked models. It is currently hard-coded to check a store in Boulder, CO, which you'll probably want to update. You can find Apple's store numbers online, or just by sniffing Apple.com network traffic.

```
URL Pattern:
https://www.apple.com/shop/fulfillment-messages
  ?parts.0=MMQX3LL%2FA  // URL encoded part number MMQX3LL/A
  &parts.1=MKH53LL%2FA  // URL encoded part number MKH53LL/A
  &parts.2=MYD92LL%2FA  // URL encoded part number MYD92LL/A
  ...
  &searchNearby=true    // Instruct the API to search the designated store and the surrounding area
  &store=R172           // Store number (R172 is in Boulder, CO)
```