/* global ethers */
/* eslint prefer-const: "off" */
import { ethers } from "hardhat";
import * as util from "./util";
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function main () {
  const addresses = await util.getContractAddresses()
  await util.initContracts()
  const addressesOld = {
    BitpixelsD2Facet: await util.getDiamondLoupeFacetContract().facetAddress('0x70a08231'),
    RentFacet: await util.getDiamondLoupeFacetContract().facetAddress('0x7e0a0c6b'),
    ReaderFacet: await util.getDiamondLoupeFacetContract().facetAddress('0xb7251433'),
    MarketFacet: await util.getDiamondLoupeFacetContract().facetAddress('0x11efbf61')
  }

  const diamondLoupeFacet = util.getDiamondLoupeFacetContract()
  const diamond = util.getDiamondContract()

  const diamondCut = util.getDiamondCutFacetContract()
  let tx
  let receipt
  let functionCall

  let cut = []
  const facets = await diamondLoupeFacet.facets()
  console.log(addressesOld, facets.map(it => it['facetAddress']), 'bb')
  for (const facet of facets) {
    // @ts-ignore
    if(
      facet['facetAddress'] == addressesOld.BitpixelsD2Facet ||
      facet['facetAddress'] == addressesOld.RentFacet ||
      facet['facetAddress'] == addressesOld.ReaderFacet ||
      facet['facetAddress'] == addressesOld.MarketFacet
    ){
      console.log(`${facet['facetAddress']} : ${facet['functionSelectors']}`)
      cut.push({
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: facet['functionSelectors']
      })
    }

  }

  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond remove failed: ${tx.hash}`)
  }
  const facets2 = await diamondLoupeFacet.facets()
  console.log(facets2.map(it => it['facetAddress']), 'bb')

  const FacetNamesAdd = [
    'BitpixelsD2Facet',
    'RentFacet',
    'ReaderFacet',
    'MarketFacet'
  ]

  cut = []
  for (const FacetName of FacetNamesAdd) {
    // @ts-ignore
    const facet = await ethers.getContractAt(FacetName, addresses[FacetName])
    console.log(`${FacetName} : ${getSelectors(facet)}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // call to init function
  const readerFacet = util.getReaderFacetContract()
  functionCall = readerFacet.interface.encodeFunctionData('init')
  const withInit = false
  if(withInit){
    tx = await diamondCut.diamondCut(cut, diamond.address, functionCall)
  }else{
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 3500000 })
  }
  // console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond add failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  const facets3 = await diamondLoupeFacet.facets()
  console.log(facets3, 'cc')
  return diamond.address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
