import { ethers } from "hardhat";
import { Contract } from "ethers";
const { deployDiamond } = require('../scripts/deploy.js')

const addressesFuji = {
  diamondCutFacet: '0xDa12736d125E9FD8a13e37Fa9Babb355B046c52b',
  diamond: '0x0Fb3dB4BD0A76837BA33399B23546625bc2E98f2',
  DiamondLoupeFacet: '0x9c183Dc7e8ca0d65552cB34Bd2a6febBe6Df6cF2',
  BitpixelsD2Facet: '0x759993041431038733c81bE6c806190f09D418FF',
  RentFacet: '0x5B1255F9A72F862218Dc078d85B9e5c99491FdC4',
  ReaderFacet: '0x3F7117EDe7DEb94E6Aa20fc341B6cE8fD7663926',
  MarketFacet: '0xcF0Ea618c7869a3F40fCF1F9e457D5F15c9C5A6B'
}

const addressesMainnet = {
  diamondCutFacet: '0x444545B6FF59A7f7a52b0CAD6e5aab6eF85d826F',
  diamond: '0x483f6788F65cEeE77071aCaE82011a7E3c57aA97',
  DiamondLoupeFacet: '0x35698b25CE1a67500904746eEBEF43f7a29E50f6',
  BitpixelsD2Facet: '0x0d9e71946C234c91E3BA3Db260495C5EFd31FF10',
  RentFacet: '0x19A9423E3E87bBFA911cEc5Ca0c9311c0F0E1622',
  ReaderFacet: '0x9502dADE96F965B424df37ebacE67b2aC64d6B75',
  MarketFacet: '0x1F38ee74D8DC9909515fEFC12D378f11e35aC6B7'
}

let diamond: Contract
let diamondCutFacet: Contract
let diamondLoupeFacet: Contract
let bitpixelsD2Facet: Contract
let rentFacet: Contract
let readerFacet: Contract
let marketFacet: Contract

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
    diamondAddress = await deployDiamond()
  }else if(network == Networks.FUJI){
    diamondAddress = addressesFuji.diamond
  }else if(network == Networks.MAINNET){
    diamondAddress = addressesMainnet.diamond
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
