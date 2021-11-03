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
This script is rudimentary: it checks for two hard-coded configurations of the new MacBook Pro (14" M1 Max 32 Core GPU, 64GB RAM, 2TB SSD in both Silver and Space Gray) which are stocked by Apple Stores. It also checks for a more commonly available 13" MacBook Pro as a control. To update this script for your purposes, you'll need to find the part number for your desired configuration and update the request URL in the script. You will also want to change the store number to one closer to your location. Finding these values can be done by sniffing network traffic while using Apple.com, or just by searching the web. 

```
URL:
https://www.apple.com/shop/fulfillment-messages
  ?parts.0=MMQX3LL%2FA  // URL encoded part number MMQX3LL/A
  &parts.1=MKH53LL%2FA  // URL encoded part number MKH53LL/A
  &parts.2=MYD92LL%2FA  // URL encoded part number MYD92LL/A
  &searchNearby=true    // Instruct the API to search the designated store and the surrounding area
  &store=R172           // Store number (R172 is in Boulder, CO)
```