const wei = 1000000000000000000
const weiHalf = 100000000000000

const util = require('../scripts/util')
const { assert } = require('chai')

describe("Bitpixels ERC", async function () {
    let tx
    let receipt
    let result
    let price
    let accounts

    before(async function () {
      await util.initContracts()
      price = await util.getPrice(ethers)
      accounts = await ethers.getSigners();
    })

    it("should be same account", async () => {
        //Check owner is the deployer account
      assert.equal(await util.getReaderFacetContract().owner(), accounts[0].address, 'not same address')
    })
    it("should claim amount", async () => {
      const instance = util.getBitpixelsD2FacetContract()
        //Start Sale
      await util.getReaderFacetContract().flipSale();

      //Get current amount of tokens
      const initalSupply = parseInt(await instance.totalSupply(), 10);

      //Claim some nft from account 2 and 1
      let amount = 1;
      const result = await instance.connect(accounts[2]).claim(20,20,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})
      const result2 = await instance.connect(accounts[1]).claim(30,30,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})

      //Check total nfts minted are increased
      let res2 = parseInt(await instance.totalSupply(), 10);
      assert.equal(initalSupply + amount * 2, res2, 'not claimed')
      //Check account balances are updated
      assert.equal(amount, await instance.balanceOf(accounts[1].address), 'acc1 not received')
      assert.equal(amount, await instance.balanceOf(accounts[2].address), 'acc2 not received')
      //Check ownerships are right for accounts claiming nfts
      for(let i = 0; i < amount; i++){
          assert.equal(accounts[2].address, await instance.ownerOf(2021 + i), 'not owned 2')
      }
      for(let i = 0; i < amount; i++){
          assert.equal(accounts[1].address, await instance.ownerOf(3031 + i), 'not owned 1')
      }
      //Transfer nfts from account 2 and 1 to account 3
      for(let i = 0; i < amount; i++){
          await instance.connect(accounts[2])['safeTransferFrom(address,address,uint256)'](accounts[2].address, accounts[3].address, 2021 + i)
      }for(let i = 0; i < amount; i++){
          await instance.connect(accounts[1])['safeTransferFrom(address,address,uint256)'](accounts[1].address, accounts[3].address, 3031 + i)
      }
      // //Check account 3 balance after transfers
      assert.equal(amount * 2, await instance.balanceOf(accounts[3].address), 'acc3 not received')
      // //Approve account 4 for account 3's first nft
      await instance.connect(accounts[3]).approve(accounts[4].address, 2021)
      assert.equal(accounts[4].address, await instance.getApproved(2021), 'acc4 not approved')
      // //Check acc4 has no balance after approval
      assert.equal(0, await instance.balanceOf(accounts[4].address), 'acc4 balance 0')
      // //Check non approved accounts can not transfer
      let autResult = 0;
      try{
          await instance.connect(accounts[6])['safeTransferFrom(address,address,uint256)'](accounts[3].address, accounts[5].address, 2021)
      }catch (e) {
          autResult = 1
      }
      assert.equal(1, autResult, 'not authorized transfer')
      // //Check approved accounts can transfer
      await instance.connect(accounts[4])['safeTransferFrom(address,address,uint256)'](accounts[3].address, accounts[5].address, 2021)
      // //Check account 3 balance after transfer
      assert.equal(amount * 2 - 1, await instance.balanceOf(accounts[3].address), 'acc4 not transferred')
      // //Check account 5 get the token after account4(approved by account3) transferred it
      assert.equal(1, await instance.balanceOf(accounts[5].address), 'acc5 not get')
      // //Check acc4 has still no balance
      assert.equal(0, await instance.balanceOf(accounts[4].address), 'acc4 balance 0-2')
    })
    it("should get balance back", async () => {
      //Get balances of contract and owner before operations
      const balanceContract = await ethers.provider.getBalance(util.getDiamondAddress());
      const balance = await ethers.provider.getBalance(await util.getReaderFacetContract().owner());

      //Claim some nft for owner account and calculate total gas used
      let amount = 3;
      const result = await util.getBitpixelsD2FacetContract().claim(14,67,amount,1, {value: ethers.utils.parseEther((amount * price).toString())})
      const trans = await ethers.provider.getTransactionReceipt(result.hash)
      const gasUsed = trans.gasUsed.toNumber();
      const gasPrice = result.gasPrice.toNumber();
      //Get new balances of contract and owner account
      let balanceContractNew = await ethers.provider.getBalance(util.getDiamondAddress());
      let balanceNew = await ethers.provider.getBalance(await util.getReaderFacetContract().owner());
      //Check owner account paid for claimed tokens
      assert.equal(Math.floor((balance - (amount * price * wei) - (gasPrice * (gasUsed))) / weiHalf) , Math.floor(balanceNew / weiHalf), 'not paid for tokens')
      //Check contract received owner's balance for claimed tokens
      assert.equal((balanceContractNew - amount * price * wei)/weiHalf, balanceContract / weiHalf, 'contract balance not paid')
      //Check only contract owner can withdraw partially
      let autResult = 0;
      try{
          await util.getBitpixelsD2FacetContract().connect(accounts[6]).withdrawAmount(ethers.utils.parseEther("0.002"))
      }catch (e) {
          autResult = 1
      }
      assert.equal(1, autResult, 'not authorized transfer')
      //Check only contract owner can withdraw completely
      try{
          await util.getBitpixelsD2FacetContract().connect(accounts[6]).withdraw()
      }catch (e) {
          autResult = 2
      }
      assert.equal(2, autResult, 'not authorized transfer')
      //Withdraw partial amount from contract to owner and calculate gas used
      const result3 = await util.getBitpixelsD2FacetContract().withdrawAmount(ethers.utils.parseEther("0.002"));
      const trans2 = await ethers.provider.getTransactionReceipt(result3.hash)
      const gasUsed3 = trans2.gasUsed.toNumber();
      const gasPrice3 = result3.gasPrice.toNumber();
      //Check owner get withdrawn balance from contract
      assert.equal(Math.floor((Number(balanceNew) + 0.002 * wei - gasPrice3 * gasUsed3) / weiHalf), Math.floor(await ethers.provider.getBalance(await util.getReaderFacetContract().owner()) / weiHalf), 'contract balance not paid amount')
      //Withdraw all balance from contract and calculate gas used
      const result2 = await util.getBitpixelsD2FacetContract().withdraw()
      const trans3 = await ethers.provider.getTransactionReceipt(result2.hash)
      const gasUsed2 = trans3.gasUsed.toNumber();
      const gasPrice2 = result2.gasPrice.toNumber();
      //Get latest balances of contract and owner
      balanceNew = await ethers.provider.getBalance(await util.getReaderFacetContract().owner());
      balanceContractNew = await ethers.provider.getBalance(util.getDiamondAddress());
      //Check contract has no balance after withdraw
      assert.equal(balanceContractNew, 0, 'contract balance not paid2')
      //Check owner has its own first balance except gas prices
      assert.equal(Math.floor((Number(balanceContract) + Number(balance) - (gasUsed2 * gasPrice2) - (gasUsed * gasPrice) - (gasUsed3 * gasPrice3)) / weiHalf), Math.floor(balanceNew / weiHalf), 'withdraw failed2')
    })
})

