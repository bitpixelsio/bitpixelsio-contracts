/* global ethers */
/* eslint prefer-const: "off" */
import { ethers } from "hardhat";
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

const addresses = {
  diamondCutFacet: '0xDa12736d125E9FD8a13e37Fa9Babb355B046c52b',
  diamond: '0x0Fb3dB4BD0A76837BA33399B23546625bc2E98f2',
  DiamondLoupeFacet: '0x9c183Dc7e8ca0d65552cB34Bd2a6febBe6Df6cF2',
  BitpixelsD2Facet: '0x14B5571Db7D7cc8aFC1E3DFB5416edBf69081BcC',
  RentFacet: '0x04f2F9C93502505BE0b4b8C26004b9Bc74abD019',
  ReaderFacet: '0x9FBf701A28995b2F9f2231b6898E3d2F8187D060',
  MarketFacet: '0xa9A8c93339a4414511b30acA6FA5ee30ad92101C'
}

async function main () {
  const accounts = await ethers.getSigners()
  const diamond = await ethers.getContractAt('Diamond', addresses.diamond)

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
  const readerFacet = await ethers.getContractAt('ReaderFacet', diamond.address)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
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
