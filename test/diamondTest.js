/* global describe it before ethers */

const {
  getSelectors,
} = require('../scripts/libraries/diamond.js')

const { assert } = require('chai')
const util = require('../scripts/util')

describe('DiamondTest', async function () {
  let result
  const addresses = []

  before(async function () {
    await util.initContracts()
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await util.getDiamondLoupeFacetContract().facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 6)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(util.getDiamondCutFacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(util.getDiamondLoupeFacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(util.getBitpixelsD2FacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[2])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(util.getRentFacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[3])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(util.getReaderFacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[4])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(util.getMarketFacetContract())
    result = await util.getDiamondLoupeFacetContract().facetFunctionSelectors(addresses[5])
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await util.getDiamondLoupeFacetContract().facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await util.getDiamondLoupeFacetContract().facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[2],
      await util.getDiamondLoupeFacetContract().facetAddress('0x70a08231')
    )
    assert.equal(
      addresses[3],
      await util.getDiamondLoupeFacetContract().facetAddress('0x7e0a0c6b')
    )
    assert.equal(
      addresses[4],
      await util.getDiamondLoupeFacetContract().facetAddress('0x3d0630a6')
    )
    assert.equal(
      addresses[5],
      await util.getDiamondLoupeFacetContract().facetAddress('0x11efbf61')
    )
  })

  it('check initialization', async () => {
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
  })
})
