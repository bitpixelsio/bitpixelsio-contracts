// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibAppStorage.sol";
import "../interfaces/IRentablePixel.sol";
import "../libraries/DateTime.sol";
import "../libraries/LibRent.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import "../libraries/LibReflection.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

contract ReaderFacet is IERC173, ReentrancyGuard {
    AppStorage internal s;

    function init() external {
        LibDiamond.enforceIsContractOwner();
        s.feeReceiver = payable(LibDiamond.contractOwner());
        s.feePercentage = 150;
        s.baseUri = AppConstants.isTestMode != 1 ? "https://bitpixels.io/token/" : "https://bitpixels-test.web.app/token/";
        s._name = "Bitpixels for Avax";
        s._symbol = "BITPIXELS";
        s.limitMinDaysToRent = 30;
        s.limitMaxDaysToRent = 30;
        s.limitMinDaysBeforeRentCancel = 10;
        s.limitMaxDaysForRent = 90;
        s._status = AppConstants._NOT_ENTERED;
        s.reflectionPercentage = 200;
    }


    function name() public view virtual returns (string memory) {
        return s._name;
    }

    function symbol() public view virtual returns (string memory) {
        return s._symbol;
    }

    function getRentData(uint256 pixelId) public view returns(IRentablePixel.RentData[] memory){
        return s.RentStorage[pixelId];
    }

    function getTotalLockedValue() public view returns(uint256){
        return s.totalLockedValue;
    }

    function getTotalLockedValueByAddress(address _addr) public view returns(uint256){
        return s.totalLockedValueByAddress[_addr];
    }

    function getSaleStarted() public view returns(uint256){
        return s.isSaleStarted;
    }

    function getRentStarted() public view returns(uint256){
        return s.isRentStarted;
    }

    function getMarketStarted() public view returns(uint256){
        return s.isMarketStarted;
    }

    function flipSale() public {
        LibDiamond.enforceIsContractOwner();
        s.isSaleStarted = 1 - s.isSaleStarted;
    }

    function flipMarket() public {
        LibDiamond.enforceIsContractOwner();
        s.isMarketStarted = 1 - s.isMarketStarted;
    }

    function flipRent() public {
        LibDiamond.enforceIsContractOwner();
        s.isRentStarted = 1 - s.isRentStarted;
    }

    function getMinDaysToRent() public view returns(uint256){
        return s.limitMinDaysToRent;
    }

    function setMinDaysToRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMinDaysToRent = value;
    }

    function getMaxDaysToRent() public view returns(uint256){
        return s.limitMaxDaysToRent;
    }

    function setMaxDaysToRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMaxDaysToRent = value;
    }

    function getMinDaysBeforeRentCancel() public view returns(uint256){
        return s.limitMinDaysBeforeRentCancel;
    }

    function setMinDaysBeforeRentCancel(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMinDaysBeforeRentCancel = value;
    }

    function getMaxDaysForRent() public view returns(uint256){
        return s.limitMaxDaysForRent;
    }

    function setMaxDaysForRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMaxDaysForRent = value;
    }

    function getReflectionPercentage() public view returns(uint256){
        return s.reflectionPercentage;
    }

    function setReflectionPercentage(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.reflectionPercentage = value;
    }

    function claimableRent() external view returns(uint256){
        require(s.isRentStarted == 1, "Rent has not started");
        DateTime._DateTime memory _now = DateTime.parseTimestamp(block.timestamp);
        uint256 nowTimestampDay = AppConstants.isTestMode == 1 ? block.timestamp : DateTime.toTimestamp(_now.year, _now.month, _now.day);
        uint256 rentTotal;
        uint256[] memory pixelIds = LibERC721._tokensOfOwner(LibMeta.msgSender());
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 index = pixelIds[i];
            IRentablePixel.RentData[] storage rentData = s.RentStorage[index];
            for (uint256 j = 0; j < rentData.length ; j++) {
                if(nowTimestampDay > rentData[j].startTimestamp && rentData[j].tenant != address(0)){
                    uint256 maxTimeStamp = nowTimestampDay;
                    if(nowTimestampDay > rentData[j].endTimestamp){
                        maxTimeStamp = rentData[j].endTimestamp;
                    }
                    uint256 dayDifference = LibRent.toDayDifference(rentData[j].startTimestamp, maxTimeStamp) - rentData[j].rentCollectedDays;
                    if(dayDifference > 0){
                        uint256 cost = LibRent.calculateRentCost(rentData[j], rentData[j].startTimestamp, rentData[j].endTimestamp);
                        rentTotal += cost * dayDifference / LibRent.toDayDifference(rentData[j].startTimestamp, rentData[j].endTimestamp);
                    }
                }
            }
        }
        uint256 fee = LibMarket.serviceFee(rentTotal);
        return rentTotal - fee;
    }

    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
    }

    function owner() external override view returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }

    function getReflectionBalance() public view returns(uint256){
        return s.reflectionBalance;
    }

    function getTotalDividend() public view returns(uint256){
        return s.totalDividend;
    }

    function getLastDividendAt(uint256 tokenId) public view returns(uint256){
        return s.lastDividendAt[tokenId];
    }

    function getCurrentReflectionBalance() public view returns(uint256){
        return s.currentReflectionBalance;
    }

    function currentRate() public view returns (uint256){
        if(s._allTokens.length == 0) return 0;
        return s.reflectionBalance / s._allTokens.length;
    }

    function getReflectionBalances(address user) external view returns(uint256) {
        uint256 total = 0;
        uint256[] memory ownedPixels = LibERC721._tokensOfOwner(user);
        for(uint256 i = 0; i < ownedPixels.length; i++){
            uint256 pixelIndex = ownedPixels[i];
            total += LibReflection._getReflectionBalance(pixelIndex);
        }
        return total;
    }

    function claimRewards() external nonReentrant {
        uint256[] memory ownedPixels = LibERC721._tokensOfOwner(LibMeta.msgSender());
        for(uint256 i= 0; i < ownedPixels.length; i++){
            uint256 pixelIndex = ownedPixels[i];
            LibReflection._claimReward(pixelIndex);
        }
    }
}
