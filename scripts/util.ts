import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
const { deployDiamond } = require('../scripts/deploy.js')

const addressesFuji = {
  diamondCutFacet: '0xDa12736d125E9FD8a13e37Fa9Babb355B046c52b',
  diamond: '0x0Fb3dB4BD0A76837BA33399B23546625bc2E98f2',
  DiamondLoupeFacet: '0x9c183Dc7e8ca0d65552cB34Bd2a6febBe6Df6cF2',
  BitpixelsD2Facet: '0x98D1116551b80be4b6256F1EDB5b8931640F27Bb',
  RentFacet: '0xCFA1A3138F6A2EdC120A06399409FeDb5F712915',
  ReaderFacet: '0x57057a4A28A9bfE2652776125538576b844EF960',
  MarketFacet: '0xc2C7fC332ace230A03D78062e858c113eB2538DD',
  BitpixelsFeeReceiver: '0x2848eeE893C455bFF7A1A5c9Ea68310B6698938d'
}

const addressesMainnet = {
  diamondCutFacet: '0x444545B6FF59A7f7a52b0CAD6e5aab6eF85d826F',
  diamond: '0x483f6788F65cEeE77071aCaE82011a7E3c57aA97',
  DiamondLoupeFacet: '0x35698b25CE1a67500904746eEBEF43f7a29E50f6',
  BitpixelsD2Facet: '0x975E96f8d80013fDf154bb34Eec87e0F88B3Dd27',
  RentFacet: '0x92944e4574F264B991A2AE87D86aC5cab8a5dF57',
  ReaderFacet: '0xe9e66A76c6d318a0C3471F93626469B2e714D2DD',
  MarketFacet: '0x9daA1f1807F8869AC6EF7060297a9d1CFF700423',
  BitpixelsFeeReceiver: '0xF81DA80e860b0aD4B02A783A33d184F6a4bA5e6C'
}

let diamond: Contract
let diamondCutFacet: Contract
let diamondLoupeFacet: Contract
let bitpixelsD2Facet: Contract
let rentFacet: Contract
let readerFacet: Contract
let marketFacet: Contract
let feeReceiver: Contract

export enum Networks{
  LOCAL,
  FUJI,
  MAINNET
}

export async function getContractAddresses(): Promise<{diamondCutFacet: string,
  diamond: string,
  DiamondLoupeFacet: string,
  BitpixelsD2Facet: string,
  RentFacet: string,
  ReaderFacet: string,
  MarketFacet: string}>{
  const network = await getNetworkType(ethers)
  if(network == Networks.LOCAL){
    return {
      diamondCutFacet: '',
      diamond: '',
      DiamondLoupeFacet: '',
      BitpixelsD2Facet: '',
      RentFacet: '',
      ReaderFacet: '',
      MarketFacet: ''
    }
  }else if(network == Networks.FUJI){
    return addressesFuji
  }else{
    return addressesMainnet
  }
}

export async function initContracts(){
  const network = await getNetworkType(ethers)
  let diamondAddress;
  if(network == Networks.LOCAL){
    const addresses = await deployDiamond()
    diamondAddress = addresses.diamond
    feeReceiver = await ethers.getContractAt('BitpixelsFeeReceiver', addresses.feeReceiver)
  }else if(network == Networks.FUJI){
    diamondAddress = addressesFuji.diamond
    feeReceiver = await ethers.getContractAt('BitpixelsFeeReceiver', addressesFuji.BitpixelsFeeReceiver)
  }else if(network == Networks.MAINNET){
    diamondAddress = addressesMainnet.diamond
    feeReceiver = await ethers.getContractAt('BitpixelsFeeReceiver', addressesMainnet.BitpixelsFeeReceiver)
  }
  diamond = await ethers.getContractAt('Diamond', diamondAddress)
  diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  bitpixelsD2Facet = await ethers.getContractAt('BitpixelsD2Facet', diamondAddress)
  rentFacet = await ethers.getContractAt('RentFacet', diamondAddress)
  readerFacet = await ethers.getContractAt('ReaderFacet', diamondAddress)
  marketFacet = await ethers.getContractAt('MarketFacet', diamondAddress)
}

export async function getPrice(ethers){
  if(await getNetworkType(ethers) == Networks.MAINNET){
    return 1
  }else{
    return 0.001
  }
}

export function getDiamondAddress(){
  return getDiamondContract().address;
}

export function getDiamondContract(): Contract{
  return diamond;
}

export function getDiamondCutFacetContract(): Contract{
  return diamondCutFacet;
}

export function getDiamondLoupeFacetContract(): Contract{
  return diamondLoupeFacet;
}

export function getBitpixelsD2FacetContract(): Contract{
  return bitpixelsD2Facet;
}

export function getRentFacetContract(): Contract{
  return rentFacet;
}

export function getReaderFacetContract(): Contract{
  return readerFacet;
}

export function getMarketFacetContract(): Contract{
  return marketFacet;
}

export function getFeeReceiverContract(): Contract{
  return feeReceiver;
}

export async function getNetworkType(ethers){
  const chainId = (await ethers.provider.getNetwork()).chainId
  if(chainId == 43112){
    console.log('LOCAL NETWORK')
    return Networks.LOCAL
  }else if(chainId == 43113){
    console.log('FUJI NETWORK')
    return Networks.FUJI
  }else if(chainId == 43114){
    console.log('AVALANCE MAINNET')
    return Networks.MAINNET
  }
  return Networks.LOCAL
}

export function getPixelIds(x, y, width, height){
  const ids = [];
  for(let i = x; i < x + width; i++){
    for(let j = y; j < y + height; j++){
      ids.push(j * 100 + i + 1)
    }
  }
  return ids;
}

export async function generateBlock(ethers, accFrom, accToAddress){
  let tx = {
    to: accToAddress,
    value: ethers.utils.parseEther("0.00001")
  }
  accFrom.sendTransaction(tx)
}

export function sleep(ms){
  return new Promise(resolve=>{
    // @ts-ignore
    setTimeout(resolve,ms)
  })
}

export function dateToInput(date: Date, isTest = true){
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), isTest ? date.getUTCHours() : 0, isTest ? date.getUTCMinutes() : 0, isTest ? date.getUTCSeconds() : 0]
}

export async function getGasCost(transaction): Promise<BigNumber>{
  const trans = await ethers.provider.getTransactionReceipt(transaction.hash)
  const gasUsed = trans.gasUsed;
  const gasPrice = transaction.gasPrice;
  return gasUsed.mul(gasPrice)
}

function getReserverControl(){
  let count = 0
  for(let x = 0; x < 100; x++){
    for(let y = 0; y < 100; y++){
      let cond = 0
      if(x >= 11 && x < 21 && y >= 13 && y <20 ){
        cond++
      }
      if(x >= 10 && x < 25 && y >= 43 && y <49 ){
        cond++
      }
      if(x >= 14 && x < 19 && y >= 67 && y <82 ){
        cond++
      }
      if(x >= 3 && x < 18 && y >= 90 && y <96 ){
        cond++
      }
      if(x >= 32 && x < 38 && y >= 7 && y <19 ){
        cond++
      }
      if(x >= 89 && x < 95 && y >= 14 && y < 36 ){
        cond++
      }
      if(x >= 26 && x < 39 && y >= 83 && y <89 ){
        cond++
      }
      if(x >= 46 && x < 59 && y >= 83 && y <89 ){
        cond++
      }
      if(x >= 65 && x < 73 && y >= 13 && y <20 ){
        cond++
      }
      if(x >= 63 && x < 70 && y >= 53 && y <65 ){
        cond++
      }
      if(x >= 82 && x < 92 && y >= 85 && y <95 ){
        cond++
      }
      if(x >= 92 && x < 97 && y >= 43 && y <58 ){
        cond++
      }
      if(cond == 1){
        count++;
      }else if(cond > 1){
        console.log(x, y)
      }
    }
  }
  console.log(count)
}
