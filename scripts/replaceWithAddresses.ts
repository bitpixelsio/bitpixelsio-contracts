/* global ethers */
/* eslint prefer-const: "off" */
import { ethers } from "hardhat";
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

const addressesOld = {
  diamondCutFacet: '0xDa12736d125E9FD8a13e37Fa9Babb355B046c52b',
  diamond: '0x0Fb3dB4BD0A76837BA33399B23546625bc2E98f2',
  DiamondInit: '0xc5f4D22A00b33FaAFCD21Ff720a8eD6605dE1216',
  DiamondLoupeFacet: '0x9c183Dc7e8ca0d65552cB34Bd2a6febBe6Df6cF2',
  BitpixelsD2Facet: '0x14B5571Db7D7cc8aFC1E3DFB5416edBf69081BcC',
  RentFacet: '0x04f2F9C93502505BE0b4b8C26004b9Bc74abD019',
  ReaderFacet: '0xadA6B429deFBFF15ad6aa08DE25a6fF02253f6E6',
  MarketFacet: '0xa9A8c93339a4414511b30acA6FA5ee30ad92101C'
}

const addresses = {
  BitpixelsD2Facet: '0x27Fe21f3B64f864B6276C2C2A330c0de5F19112D',
  RentFacet: '0xAF612c2676158E14506D47FdDdCcD47e4BdB2E32',
  ReaderFacet: '0x854AD81E984b814C5bEc5d3052D64EaF1ED8d5C7',
  MarketFacet: '0x780C7B4B871377F1f2bd73c26fa064D02a0eB4eD'
}

async function main () {
  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', addressesOld.diamond)
  const diamond = await ethers.getContractAt('Diamond', addressesOld.diamond)

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  let functionCall

  let cut = []
  const facets = await diamondLoupeFacet.facets()
  console.log(facets)
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
  console.log(facets2, 'bb')

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
  const readerFacet = await ethers.getContractAt('ReaderFacet', diamond.address)
  functionCall = readerFacet.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamond.address, functionCall)
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
