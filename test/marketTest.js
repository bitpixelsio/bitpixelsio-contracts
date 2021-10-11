const wei = 1000000000000000000
const weiHalf = 100000000000000

const util = require('../scripts/util')
const { assert } = require('chai')

describe("Bitpixels ERC", async function () {
    let tx
  let receipt
  let result
  let autResult
  let price
  let accounts

  before(async function () {
    await util.initContracts()
    price = await util.getPrice(ethers)
    accounts = await ethers.getSigners();
  })

  it("market should work", async () => {
    //Check initial fee is %2, (20 is used for one more float operations to allow values like %2.5)
    assert.equal(150, parseInt(await util.getMarketFacetContract().getFeePercentage(), 10), "Base fee is wrong")
    await util.getMarketFacetContract().setFeePercentage(100);
    //Check fee percentage has changed
    assert.equal(100, parseInt(await util.getMarketFacetContract().getFeePercentage(), 10), "Fee is not changed")
    //Change fee percentage to %3
    const feePercentage = 150
    await util.getMarketFacetContract().setFeePercentage(feePercentage);

    //Check other accounts can't change fee
    try{
      await util.getMarketFacetContract().connect(accounts[1]).setFeePercentage(feePercentage)
    }catch (e) {
      autResult = 1
    }
    assert.equal(1, autResult, 'fee cannot be changed by others')

    //Check sale is not started initially
    assert.equal(0, parseInt(await util.getReaderFacetContract().getSaleStarted(), 10))
    //Start sale
    await util.getReaderFacetContract().flipSale();
    //Check sale has started
    assert.equal(1, parseInt(await util.getReaderFacetContract().getSaleStarted(), 10))
    //Check other accounts can't change sale state
    try{
      await util.getReaderFacetContract().connect(accounts[1]).flipSale()
    }catch (e) {
      autResult = 2
    }
    assert.equal(2, autResult, 'sale cannot be changed by others')

    //Check initial fee receiver is contract owner
    assert.equal(await util.getMarketFacetContract().getFeeReceiver(), accounts[0].address, 'fee receiver not owner')
    //Change fee receiver to some other account
    await util.getMarketFacetContract().setFeeReceiver(accounts[2].address);
    //Check fee receiver changed
    assert.equal(await util.getMarketFacetContract().getFeeReceiver(), accounts[2].address, 'fee receiver not changed')
    //Check only owner can change fee receiver
    try{
      await util.getMarketFacetContract().connect(accounts[1]).setFeeReceiver(accounts[2].address)
    }catch (e) {
      autResult = 3
    }
    assert.equal(3, autResult, 'fee receiver cannot be changed by others')

    //Get balance in acc2
    const balanceAddr2 = await ethers.provider.getBalance(accounts[2].address);

    //Claim some tokens for acc3 and acc4
    let amount = 2;
    await util.getBitpixelsD2FacetContract().connect(accounts[3]).claim(5,5,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})
    await util.getBitpixelsD2FacetContract().connect(accounts[4]).claim(50,50,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})

    //Stop sale
    await util.getReaderFacetContract().flipSale();
    //Check claim is not available when sale stopped
    try{
      await util.getBitpixelsD2FacetContract().connect(accounts[3]).claim(15,15,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})
    }catch (e) {
      autResult = 4
    }
    assert.equal(4, autResult, 'Claim should not be available for sale')

    //Check market is not available when sale stopped
    try{
      await util.getMarketFacetContract().connect(accounts[3]).setTokenPrice(util.getPixelIds(5,5,amount,1)[0],  ethers.utils.parseEther((amount * price * 4).toString()))
    }catch (e) {
      autResult = 5
    }
    assert.equal(5, autResult, 'Token pricing should not be available for sale')

    //Restart sale
    await util.getReaderFacetContract().flipSale();
    await util.getReaderFacetContract().flipMarket();

    //Check only owners can start sale for tokens
    try{
      await util.getMarketFacetContract().connect(accounts[4]).setTokenPrice(util.getPixelIds(5,5,amount,1)[0],  ethers.utils.parseEther((amount * price * 4).toString()))
    }catch (e) {
      autResult = 6
    }
    assert.equal(6, autResult, 'Token pricing should not be available from another account')

    //Start sale for token 1 and 3(claimed amount was 2)
    await util.getMarketFacetContract().connect(accounts[3]).setTokenPrice(util.getPixelIds(5,5,amount,1)[0],  ethers.utils.parseEther((amount * price * 4).toString()))
    await util.getMarketFacetContract().connect(accounts[4]).setTokenPrice(util.getPixelIds(50,50,amount,1)[0],  ethers.utils.parseEther((amount * price * 6).toString()))

    //Get market data for token 1 and 3
    let market1 = await util.getMarketFacetContract().getMarketData(util.getPixelIds(5,5,amount,1)[0])
    let market3 = await util.getMarketFacetContract().getMarketData(util.getPixelIds(50,50,amount,1)[0])
    //Check sale values are correct for token 1 and 3
    //State for markets are as follow: 0: pending, 1: for sale, 2: sold, 3: neutral
    assert.equal(market1[0].toString(), (amount * 4 * wei * price).toString(), "token price 1 wrong")
    assert.equal(market3[0].toString(), (amount * 6 * wei * price).toString(), "token price 3 wrong")
    assert.equal(market1[1], 1, "token state 1 wrong")
    assert.equal(market3[1], 1, "token state 3 wrong")

    //Transfer token 1 to new account
    await util.getBitpixelsD2FacetContract().connect(accounts[3])['safeTransferFrom(address,address,uint256)'](accounts[3].address, accounts[5].address, util.getPixelIds(5,5,amount,1)[0])
    market1 = await util.getMarketFacetContract().getMarketData(util.getPixelIds(5,5,amount,1)[0])
    //Check sale is stopped for token 1 after transfer
    assert.equal(market1[0].toNumber(), 0, "token price 1 wrong-2")
    assert.equal(market1[1], 3, "token state 1 wrong-2")

    //Transfer token back to acc3
    await util.getBitpixelsD2FacetContract().connect(accounts[5])['safeTransferFrom(address,address,uint256)'](accounts[5].address, accounts[3].address, util.getPixelIds(5,5,amount,1)[0])
    //Resale token 1 from acc3
    await util.getMarketFacetContract().connect(accounts[3]).setTokenPrice(util.getPixelIds(5,5,amount,1)[0],  ethers.utils.parseEther((amount * price * 4).toString()))
    //Check sale can only be cancelled from owner account
    try{
      await util.getMarketFacetContract().connect(accounts[5]).cancelTokenSale(util.getPixelIds(5,5,amount,1)[0])
    }catch (e) {
      autResult = 7
    }
    assert.equal(7, autResult, 'Token cancel not authorized')
    //Cancel token sale
    await util.getMarketFacetContract().connect(accounts[3]).cancelTokenSale(util.getPixelIds(5,5,amount,1)[0])
    //Check if sale is cancelled
    market1 = await util.getMarketFacetContract().getMarketData(util.getPixelIds(5,5,amount,1)[0])
    assert.equal(market1[0].toNumber(), 0, "token price 1 wrong-3")
    assert.equal(market1[1], 3, "token state 1 wrong-3")

    //Restart sale
    await util.getMarketFacetContract().connect(accounts[3]).setTokenPrice(util.getPixelIds(5,5,amount,1)[0],  ethers.utils.parseEther((amount * price * 4).toString()))

    //Try to buy token 1 with a low value then listing price
    try{
      await util.getMarketFacetContract().connect(accounts[6]).buy(util.getPixelIds(5,5,amount,1)[0], {value: ethers.utils.parseEther((amount * 3 * price).toString())})
    }catch (e) {
      autResult = 8
    }
    assert.equal(8, autResult, 'Token sale value was low')

    //Buy token 1 from another account
    await util.getMarketFacetContract().connect(accounts[6]).buy(util.getPixelIds(5,5,amount,1)[0], {value: ethers.utils.parseEther((amount * 4 * price).toString())})
    //Check sale is stopped
    market1 = await util.getMarketFacetContract().getMarketData(util.getPixelIds(5,5,amount,1)[0])
    assert.equal(market1[0].toNumber(), 0, "token price 1 wrong-4")
    assert.equal(market1[1], 2, "token state 1 wrong-4")
    //Check new owner is received
    assert.equal(1, (await util.getBitpixelsD2FacetContract().balanceOf(accounts[6].address)).toNumber(), 'acc6 not received')
    //
    //Check fee receiver received its fees
    const balanceAddr2New = await ethers.provider.getBalance(accounts[2].address);
    assert.equal(Math.floor((balanceAddr2New - balanceAddr2)/weiHalf), Math.floor(amount * 4 * price * wei * feePercentage / 1000 / weiHalf), 'fee not received')

  })
})
