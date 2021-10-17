/* global ethers */
/* eslint prefer-const: "off" */
import { ethers } from "hardhat";
import * as util from "./util";
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function main () {
  const addresses = await util.getContractAddresses()
  await util.initContracts()
  const diamond = util.getDiamondContract()

  const FacetNames = [
    'DiamondLoupeFacet',
    'BitpixelsD2Facet',
    'RentFacet',
    'ReaderFacet',
    'MarketFacet'
  ]

  const cut = []
  for (const FacetName of FacetNames) {
    // @ts-ignore
    const facet = await ethers.getContractAt(FacetName, addresses[FacetName])
    console.log(`${FacetName} : ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  // console.log('')
  // console.log('Diamond Cut:', cut)
  const readerFacet = util.getReaderFacetContract()
  const diamondCut = util.getDiamondCutFacetContract()
  let tx
  let receipt
  // call to init function
  let functionCall = readerFacet.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamond.address, functionCall)
  // console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
