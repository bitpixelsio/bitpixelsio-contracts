/* global ethers */
/* eslint prefer-const: "off" */
import { ethers } from "hardhat";
import * as util from "./util";
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const { assert } = require('chai')

let result

const facetAddresses = []

async function main () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  await util.initContracts()

  for (const address of await util.getDiamondLoupeFacetContract().facetAddresses()) {
    facetAddresses.push(address)
  }
  console.log(facetAddresses)
  assert.equal(facetAddresses.length, 6)

  let selectors = getSelectors(util.getDiamondCutFacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[0])
  assert.sameMembers(result, selectors)
  selectors = getSelectors(util.getDiamondLoupeFacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[1])
  assert.sameMembers(result, selectors)
  selectors = getSelectors(util.getBitpixelsD2FacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[2])
  assert.sameMembers(result, selectors)
  selectors = getSelectors(util.getRentFacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[3])
  assert.sameMembers(result, selectors)
  selectors = getSelectors(util.getReaderFacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[4])
  assert.sameMembers(result, selectors)
  selectors = getSelectors(util.getMarketFacetContract())
  result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(facetAddresses[5])
  assert.sameMembers(result, selectors)

  assert.equal(
    facetAddresses[0],
    await util.getDiamondLoupeFacetContract().facetAddress('0x1f931c1c')
  )
  assert.equal(
    facetAddresses[1],
    await util.getDiamondLoupeFacetContract().facetAddress('0xcdffacc6')
  )
  assert.equal(
    facetAddresses[2],
    await util.getDiamondLoupeFacetContract().facetAddress('0x70a08231')
  )
  assert.equal(
    facetAddresses[3],
    await util.getDiamondLoupeFacetContract().facetAddress('0x7e0a0c6b')
  )
  assert.equal(
    facetAddresses[4],
    await util.getDiamondLoupeFacetContract().facetAddress('0x3d0630a6')
  )
  assert.equal(
    facetAddresses[5],
    await util.getDiamondLoupeFacetContract().facetAddress('0x11efbf61')
  )

  assert.equal(
    "Bitpixels for Avax",
    await util.getReaderFacetContract().name()
  )
  assert.equal(
    "BITPIXELS",
    await util.getReaderFacetContract().symbol()
  )
  assert.equal(
    await util.getReaderFacetContract().owner(),
    await util.getMarketFacetContract().getFeeReceiver()
  )
  assert.equal(
    150,
    await util.getMarketFacetContract().getFeePercentage()
  )
  assert.equal(
    30,
    await util.getReaderFacetContract().getMinDaysToRent()
  )
  assert.equal(
    30,
    await util.getReaderFacetContract().getMaxDaysToRent()
  )
  assert.equal(
    10,
    await util.getReaderFacetContract().getMinDaysBeforeRentCancel()
  )
  assert.equal(
    90,
    await util.getReaderFacetContract().getMaxDaysForRent()
  )

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
