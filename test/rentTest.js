/* global describe it before ethers */
const weiHalf = 100000000000000

const util = require('../scripts/util')

const { assert } = require('chai')

describe('RentTest', async function () {
  let result
  let trans
  let gasUsed
  let gasPrice
  let price
  let accounts

  before(async function () {
    await util.initContracts()
    price = await util.getPrice(ethers)
    accounts = await ethers.getSigners();
  })

  it("claimTest", async () => {
    const instance = util.getBitpixelsD2FacetContract()
    //Start Sale
    await util.getReaderFacetContract().flipSale();
    await util.getReaderFacetContract().flipRent();

    //Get current amount of tokens
    const initalSupply = parseInt(await instance.totalSupply(), 10);

    result = await instance.connect(accounts[1]).claim(1, 30, 3, 2, {value: ethers.utils.parseEther((6*price).toString()) })
    let supply = parseInt(await instance.totalSupply(), 10);
    assert.equal(initalSupply + 6, supply, 'not claimed')
    assert.equal(6, await instance.balanceOf(accounts[1].address), 'acc1 not received')
    result = await instance.connect(accounts[2]).claim(5, 70, 1, 3, {value:  ethers.utils.parseEther((3*price).toString())})
    supply = parseInt(await instance.totalSupply(), 10);
    assert.equal(initalSupply + 6 + 3, supply, 'not claimed2')
    assert.equal(3, await instance.balanceOf(accounts[2].address), 'acc2 not received')
    result = await instance.connect(accounts[3]).claim(50, 65, 10, 3, {value: ethers.utils.parseEther((30*price).toString())})
    supply = parseInt(await instance.totalSupply(), 10);
    assert.equal(initalSupply + 6 + 3 + 30, supply, 'not claimed3')
    assert.equal(30, await instance.balanceOf(accounts[3].address), 'acc3 not received')

    let autResult = 0;
    try{
      await instance.connect(accounts[4]).claim(52, 65, 6, 1, {value: ethers.utils.parseEther((6*price).toString())})
    }catch (e) {
      // console.log(e, 1)
      autResult = 1
    }
    assert.equal(1, autResult, 'should ve been claimed before')
  })
  it("rentTest", async () => {
    //Change fee percentage to %15
    const feePercentage = 150
    await util.getMarketFacetContract().setFeePercentage(feePercentage);
    //Change reflection percentage to %15
    const reflectionPercentage = 200
    await util.getReaderFacetContract().setReflectionPercentage(reflectionPercentage);

    const instance = util.getRentFacetContract()
    const readerInstance = util.getReaderFacetContract()
    const blockNumber = await ethers.provider.getBlockNumber()
    const now = (await ethers.provider.getBlock(blockNumber)).timestamp
    const startTimeDelay = 7
    const endTimeDelay = 17
    const startDate = new Date(now * 1000 + startTimeDelay * 1000)
    const endDate = new Date(now * 1000 + endTimeDelay * 1000)
    const minDaysToRent = 5
    const maxDaysToRent = 20
    const minDaysBeforeRentCancel = 1
    const weeklyDiscount = 10
    const monthlyDiscount = 15
    const yearlyDiscount = 20
    const rentDailyPrice = 0.01

    await instance.connect(accounts[1]).listRenting(util.getPixelIds(1, 30, 3, 2), ethers.utils.parseEther("2"), util.dateToInput(startDate), util.dateToInput(endDate),
      minDaysToRent, maxDaysToRent, minDaysBeforeRentCancel, weeklyDiscount * 10, monthlyDiscount * 10, yearlyDiscount * 10)
    let data = (await readerInstance.getRentData(util.getPixelIds(1, 30, 3, 2)[0]))[0]
    assert.equal(data.tenant, 0, 'tenant problem')
    assert.equal(data.startTimestamp.toNumber(), now + startTimeDelay, 'wrong start')
    assert.equal(data.endTimestamp.toNumber(), now + endTimeDelay, 'wrong end')

    await instance.connect(accounts[1]).cancelRentListing([util.getPixelIds(1, 30, 3, 2)[0]], util.dateToInput(startDate), util.dateToInput(endDate))
    await instance.connect(accounts[1]).listRenting([util.getPixelIds(1, 30, 3, 2)[0]], ethers.utils.parseEther(rentDailyPrice.toString()), util.dateToInput(startDate), util.dateToInput(endDate),
      minDaysToRent, maxDaysToRent, minDaysBeforeRentCancel, weeklyDiscount * 10, monthlyDiscount * 10, yearlyDiscount * 10)

    const totalRent = rentDailyPrice * (endTimeDelay - startTimeDelay) * (100 - weeklyDiscount) / 100
    const balanceAddr2 = await ethers.provider.getBalance(accounts[2].address);
    result = await instance.connect(accounts[2]).rentPixels([util.getPixelIds(1, 30, 3, 2)[0]], util.dateToInput(startDate), util.dateToInput(endDate),
      {value: ethers.utils.parseEther(totalRent.toString())} )
    const balance2Addr2 = await ethers.provider.getBalance(accounts[2].address);
    trans = await ethers.provider.getTransactionReceipt(result.hash)
    gasUsed = trans.gasUsed.toNumber();
    gasPrice = result.gasPrice.toNumber();
    data = (await readerInstance.getRentData(util.getPixelIds(1, 30, 3, 2)[0]))[0]
    assert.equal(Math.floor((balanceAddr2 - balance2Addr2 - gasUsed * gasPrice) / weiHalf + 0.1), Math.floor(ethers.utils.parseEther(totalRent.toString()) / weiHalf), 'rent not paid')
    assert.equal(data.tenant, accounts[2].address, 'tenant problem-2')
    assert.equal(totalRent.toString(), ethers.utils.formatEther(await readerInstance.getTotalLockedValue()), 'value not locked')
    assert.equal(totalRent.toString(), ethers.utils.formatEther(await readerInstance.getTotalLockedValueByAddress(accounts[2].address)), 'value not locked2')

    result = await instance.connect(accounts[2]).cancelRent([util.getPixelIds(1, 30, 3, 2)[0]], util.dateToInput(startDate), util.dateToInput(endDate))
    trans = await ethers.provider.getTransactionReceipt(result.hash)
    gasUsed = trans.gasUsed.toNumber();
    gasPrice = result.gasPrice.toNumber();
    const balance3Addr2 = await ethers.provider.getBalance(accounts[2].address);
    data = (await readerInstance.getRentData(util.getPixelIds(1, 30, 3, 2)[0]))[0]
    assert.equal(Math.floor((balance3Addr2 - balance2Addr2 + gasUsed * gasPrice) / weiHalf + 0.1), Math.floor(ethers.utils.parseEther(totalRent.toString()) / weiHalf), 'rent not cancelled back')
    assert.equal(data.tenant, 0, 'tenant problem-2')
    assert.equal("0.0", ethers.utils.formatEther(await readerInstance.getTotalLockedValue()), 'value not locked')
    assert.equal("0.0", ethers.utils.formatEther(await readerInstance.getTotalLockedValueByAddress(accounts[2].address)), 'value not locked2')

    await instance.connect(accounts[2]).rentPixels([util.getPixelIds(1, 30, 3, 2)[0]], util.dateToInput(startDate), util.dateToInput(endDate),
      {value: ethers.utils.parseEther(totalRent.toString())} )
    data = (await readerInstance.getRentData(util.getPixelIds(1, 30, 3, 2)[0]))[0]
    assert.equal(data.tenant, accounts[2].address, 'tenant problem-3')
    assert.equal(totalRent.toString(), ethers.utils.formatEther(await readerInstance.getTotalLockedValue()), 'value not locked-3')
    assert.equal(totalRent.toString(), ethers.utils.formatEther(await readerInstance.getTotalLockedValueByAddress(accounts[2].address)), 'value not locked2-3')

    const claimRentDay = 5
    for(let i = 0; i < 60; i++){
      const blockNumber = await ethers.provider.getBlockNumber()
      const now2 = (await ethers.provider.getBlock(blockNumber)).timestamp
      const claim = await readerInstance.connect(accounts[1]).claimableRent();
      const ethVal = Number(ethers.utils.formatEther(claim))
      console.log('claimableRent: ' + ethVal + ' for day: ' + i)
      if(now2 < now + startTimeDelay){
        assert.equal(ethVal, 0, 'tenant problem')
      }else if(now2 <= now + endTimeDelay){
        if(now2 - now - startTimeDelay == claimRentDay){
          assert.equal(Math.floor(ethVal * 10000), Math.floor(rentDailyPrice * (now2 - now - startTimeDelay) * (100 - weeklyDiscount) * 100 * ((1000 - feePercentage) / 1000)), 'tenant problem')
          const balanceAddr1 = await ethers.provider.getBalance(accounts[1].address);
          const result = await instance.connect(accounts[1]).claimRent()
          console.log('Rent Claimed: ' + Math.floor(claim * (claimRentDay + 1) / claimRentDay / weiHalf) / 10000)
          const trans = await ethers.provider.getTransactionReceipt(result.hash)
          const gasUsed = trans.gasUsed.toNumber();
          const gasPrice = result.gasPrice.toNumber();
          const balance2Addr1 = await ethers.provider.getBalance(accounts[1].address);
          assert.equal(Math.floor((balance2Addr1 - balanceAddr1 + gasUsed * gasPrice) / weiHalf + 0.1), Math.floor(claim * (claimRentDay + 1)  / claimRentDay / weiHalf + 0.1), 'rent not claimed')
          data = (await readerInstance.getRentData(util.getPixelIds(1, 30, 3, 2)[0]))[0]
          assert.equal(data.rentCollectedDays, claimRentDay + 1, 'rent claim not saved')
        }else if(now2 - now - startTimeDelay < claimRentDay){
          assert.equal(Math.floor(ethVal * 10000), Math.floor(rentDailyPrice * (now2 - now - startTimeDelay) * (100 - weeklyDiscount) * 100 * ((1000 - feePercentage) / 1000)), 'tenant problem')
        }else{
          assert.equal(Math.floor(ethVal * 10000), Math.floor(rentDailyPrice * (now2 - now - startTimeDelay - claimRentDay - 1) * (100 - weeklyDiscount) * 100 * ((1000 - feePercentage) / 1000)), 'tenant problem')
        }
      }else{
        break;
      }
      await util.generateBlock(ethers, accounts[7], accounts[8].address)
      await util.sleep(1000)
    }
  })
})
