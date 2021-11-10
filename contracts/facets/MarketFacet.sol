// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibAppStorage.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMarket.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibERC721.sol";
import "../libraries/LibReflection.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MarketFacet  is IMarketPlace, ReentrancyGuard {
    AppStorage internal s;

    function getFeeReceiver() external override view returns(address payable){
        return s.feeReceiver;
    }

    function getFeePercentage() external override view returns(uint256){
        return s.feePercentage;
    }

    function setFeePercentage(uint256 _feePercentage) external override{
        LibDiamond.enforceIsContractOwner();
        require(_feePercentage <= 150, "It will never be more than 15 percentage");
        s.feePercentage = _feePercentage;
    }

    function setFeeReceiver(address _feeReceiver) external override{
        LibDiamond.enforceIsContractOwner();
        require(_feeReceiver != address(0), "No zero address");
        s.feeReceiver = payable(_feeReceiver);
    }

    function royaltyInfo(uint256, uint256 _salePrice) external view returns (address receiver, uint256 royaltyAmount){
        receiver = s.feeReceiver;
        royaltyAmount = LibMarket.serviceFee(_salePrice);
    }

    function addToCommunityRoyalties(uint256 amount) external{
        require(msg.sender == s.feeReceiver, "Must be fee receiver");
        LibReflection._reflectDividend(amount);
    }

    function setPriceMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height, uint256 totalPrice) external override{
        require(s.isMarketStarted == 1, "Market has not started");
        require(totalPrice > 1000000, "Price is too low");
        require(xCoordLeft >= 0 && yCoordTop >= 0 && width >= 1 && height >= 1 && xCoordLeft < 100 && xCoordLeft + width < 101 && yCoordTop < 100 && yCoordTop + height < 101, "Check Inputs");
        uint256[] memory pixels = new uint256[](width * height);
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                pixels[(i - xCoordLeft) + (j - yCoordTop) * width] = tokenId;
                require(LibMeta.msgSender() == LibERC721._ownerOf(tokenId), "Only owners can do");
                require(s.MarketV2Pixel[tokenId] == 0, "Token already listed");
            }
        }
        uint256 groupId = uint256(keccak256(abi.encodePacked(xCoordLeft, yCoordTop, width, height)));
        for(uint256 i = 0; i < pixels.length; i++){
            s.MarketV2Pixel[pixels[i]] = groupId;
            emit MarketList(pixels[i] , totalPrice / pixels.length, groupId);
        }
        s.MarketV2[groupId].pixels = pixels;
        s.MarketV2[groupId].totalPrice = totalPrice;
    }

    function cancelMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external override{
        require(s.isMarketStarted == 1, "Market has not started");
        require(xCoordLeft >= 0 && yCoordTop >= 0 && width >= 1 && height >= 1 && xCoordLeft < 100 && xCoordLeft + width < 101 && yCoordTop < 100 && yCoordTop + height < 101, "Check Inputs");
        uint256[] memory pixels = new uint256[](width * height);
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                pixels[(i - xCoordLeft) + (j - yCoordTop) * width] = tokenId;
                require(LibMeta.msgSender() == LibERC721._ownerOf(tokenId), "Only owners can do");
                require(s.MarketV2Pixel[tokenId] != 0, "Token not listed for sale");
            }
        }
        uint256[] memory groupsProcessed = new uint256[](pixels.length);
        for(uint256 i = 0; i < pixels.length; i++){
            uint256 groupId = s.MarketV2Pixel[pixels[i]];
            if(!LibMeta.checkContains(groupsProcessed, groupId)){
                LibMarket._cancelSaleGroup(groupId, 1);
                groupsProcessed[i] = groupId;
            }
        }
    }

    function getMarketData(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external override view returns(MarketDataRead[] memory){
        require(s.isMarketStarted == 1, "Market has not started");
        require(xCoordLeft >= 0 && yCoordTop >= 0 && width >= 1 && height >= 1 && xCoordLeft < 100 && xCoordLeft + width < 101 && yCoordTop < 100 && yCoordTop + height < 101, "Check Inputs");
        uint256 size = width * height;
        MarketDataRead[] memory data = new MarketDataRead[](size);
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                uint256 groupId = s.MarketV2Pixel[tokenId];
                MarketDataV2 memory mDataV2 = s.MarketV2[groupId];
                MarketDataRead memory mData;
                mData.pixels = mDataV2.pixels;
                mData.totalPrice = mDataV2.totalPrice;
                mData.groupId = groupId;
                data[(i - xCoordLeft) + (j - yCoordTop) * width] = mData;
            }
        }
        return data;
    }
    function buyMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external override payable nonReentrant{
        require(s.isMarketStarted == 1, "Market has not started");
        require(xCoordLeft >= 0 && yCoordTop >= 0 && width >= 1 && height >= 1 && xCoordLeft < 100 && xCoordLeft + width < 101 && yCoordTop < 100 && yCoordTop + height < 101, "Check Inputs");
        uint256[] memory pixels = new uint256[](width * height);
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                pixels[(i - xCoordLeft) + (j - yCoordTop) * width] = tokenId;
                require(s.MarketV2Pixel[tokenId] != 0, "Token not listed for sale");
            }
        }
        uint256[] memory groupsProcessed = new uint256[](pixels.length);
        uint256 totalSize = 0;
        uint256 totalValue = 0;
        for(uint256 i = 0; i < pixels.length; i++){
            uint256 groupId = s.MarketV2Pixel[pixels[i]];
            if(!LibMeta.checkContains(groupsProcessed, groupId)){
                totalSize += s.MarketV2[groupId].pixels.length;
                totalValue += s.MarketV2[groupId].totalPrice;
                groupsProcessed[i] = groupId;
            }
        }
        require(totalSize == pixels.length, "All pixels in the group not chosen");
        require(msg.value >= totalValue, "AVAX value is not enough");

        for(uint256 i = 0; i < groupsProcessed.length; i++){
            uint256 groupId = groupsProcessed[i];
            if(groupId > 0){
                uint256[] memory pixelsGroup = s.MarketV2[groupId].pixels;
                address tokenOwner = LibERC721._ownerOf(pixelsGroup[0]);
                address payable seller = payable(address(tokenOwner));
                uint256 price = s.MarketV2[groupId].totalPrice;
                for(uint256 j = 0; j < pixelsGroup.length; j++){
                    IERC721(address(this)).safeTransferFrom(tokenOwner, LibMeta.msgSender(), pixelsGroup[j]);
                }
                if (price >= 0) {
                    if(s.feePercentage > 0){
                        uint256 fee = LibMarket.serviceFee(price);
                        uint256 withFee = price - fee;

                        LibReflection._reflectDividend(fee);
                        seller.transfer(withFee);
                    }else{
                        seller.transfer(price);
                    }
                }
                for(uint256 j = 0; j < pixelsGroup.length; j++){
                    emit MarketBuy(pixelsGroup[j], price / pixelsGroup.length);
                }
            }
        }
    }
}
