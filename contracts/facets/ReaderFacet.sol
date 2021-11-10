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
        s.feePercentage = 50;
        s.baseUri = "ipfs://QmbHmTshtpK3c9GfZkQkBjHbCGxPk7RkS6iviyJJjTEdjH/";
        s._name = "Bitpixels for Avax";
        s._symbol = "BITPIXELS";
        s.limitMinDaysToRent = 30;
        s.limitMaxDaysToRent = 30;
        s.limitMinDaysBeforeRentCancel = 10;
        s.limitMaxDaysForRent = 90;
        s._status = AppConstants._NOT_ENTERED;
        s.reflectionPercentage = 500;
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

    function getCreatorBalance() public view returns(uint256){
        return s.creatorBalance;
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

    function claimableRent(address _address) external view returns(uint256){
        require(s.isRentStarted == 1, "Rent has not started");
        uint256[] memory pixelIds = LibERC721._tokensOfOwner(_address);
        uint256 rentTotal;
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            rentTotal += LibRent._claimableRentFor(pixelIds[i], 0);
        }
        return rentTotal;
    }

    function claimableRentFor(uint256 pixelId) external view returns(uint256){
        require(s.isRentStarted == 1, "Rent has not started");
        return LibRent._claimableRentFor(pixelId, 0);
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
        uint256 total;
        uint256 count;
        for(uint256 i= 0; i < ownedPixels.length; i++){
            uint256 pixelIndex = ownedPixels[i];
            uint256 reward = LibReflection._claimRewardInternal(pixelIndex, 1);
            if(reward > 0){
                count += 1;
                total += reward;
            }
            if(count > 100){
                break;
            }
        }
        if(total > 0){
            s.currentReflectionBalance -= total;
            payable(LibMeta.msgSender()).transfer(total);
        }
    }

    function claimRent() external nonReentrant{
        require(s.isRentStarted == 1, "1");//Rent has not started
        LibRent.claimRentCore(LibERC721._tokensOfOwner(LibMeta.msgSender()), LibMeta.msgSender());
    }

    function withdraw() public {
        LibDiamond.enforceIsContractOwner();
        payable(LibMeta.msgSender()).transfer(address(this).balance);
    }

    function withdrawAmount(uint amount) public{
        LibDiamond.enforceIsContractOwner();
        payable(LibMeta.msgSender()).transfer(amount);
    }

    function tokensOfOwner(address _owner) public view returns(uint256[] memory ) {
        return LibERC721._tokensOfOwner(_owner);
    }
}
