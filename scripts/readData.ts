/* global ethers */
/* eslint prefer-const: "off" */


import { getBitpixelsD2FacetContract, getMarketFacetContract, getReaderFacetContract, initContracts } from "./util";

async function main () {
  await initContracts()

  console.log('getTotalLockedValue: ' + await getReaderFacetContract().getTotalLockedValue())
  console.log('getSaleStarted: ' + await getReaderFacetContract().getSaleStarted())
  console.log('getRentStarted: ' + await getReaderFacetContract().getRentStarted())
  console.log('getMarketStarted: ' + await getReaderFacetContract().getMarketStarted())
  console.log('getMinDaysToRent: ' + await getReaderFacetContract().getMinDaysToRent())
  console.log('getMaxDaysToRent: ' + await getReaderFacetContract().getMaxDaysToRent())
  console.log('getMinDaysBeforeRentCancel: ' + await getReaderFacetContract().getMinDaysBeforeRentCancel())
  console.log('getMaxDaysForRent: ' + await getReaderFacetContract().getMaxDaysForRent())
  console.log('owner: ' + await getReaderFacetContract().owner())
  console.log('getFeeReceiver: ' + await getMarketFacetContract().getFeeReceiver())
  console.log('getFeePercentage: ' + await getMarketFacetContract().getFeePercentage())
  console.log('getReflectionPercentage: ' + await getReaderFacetContract().getReflectionPercentage())
  const totalSupply = await getBitpixelsD2FacetContract().totalSupply()
  if(totalSupply > 0){
    console.log('tokenURI: ' + await getBitpixelsD2FacetContract().tokenURI(await getBitpixelsD2FacetContract().tokenByIndex(0)))
  }
  console.log('totalSupply: ' + await getBitpixelsD2FacetContract().totalSupply())
  console.log('name: ' + await getReaderFacetContract().name())
  console.log('symbol: ' + await getReaderFacetContract().symbol())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
