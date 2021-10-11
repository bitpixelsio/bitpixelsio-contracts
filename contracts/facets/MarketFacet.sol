// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibAppStorage.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibMarket.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MarketFacet  is IMarketPlace {
    AppStorage internal s;

    function getMarketData(uint256 tokenId) external override view returns(MarketData memory){
        return s.Market[tokenId];
    }

    function getFeeReceiver() external override view returns(address payable){
        return s.feeReceiver;
    }

    function getFeePercentage() external override view returns(uint256){
        return s.feePercentage;
    }

    function buy(uint256 _tokenId) external override payable{
        require(s.isMarketStarted == 1, "Market has not started");
        address tokenOwner = LibERC721._ownerOf(_tokenId);
        address payable seller = payable(address(tokenOwner));

        require(TokenState.ForSale == s.Market[_tokenId].state, "Token is not for sale");
        require(msg.value >= s.Market[_tokenId].price, "AVAX value is not enough");

        IERC721(address(this)).safeTransferFrom(LibERC721._ownerOf(_tokenId), LibMeta.msgSender(), _tokenId);

        s.Market[_tokenId].state = TokenState.Sold;

        if (s.Market[_tokenId].price >= 0) {
            if(s.feePercentage > 0){
                uint256 fee = LibMarket.serviceFee(msg.value);
                uint256 withFee = msg.value - fee;

                seller.transfer(withFee);
                s.feeReceiver.transfer(fee);
            }else{
                seller.transfer(msg.value);
            }
        }

        emit Bought(_tokenId, msg.value);
    }

    function setTokenPrice(uint256 id, uint256 setPrice) external override{
        require(s.isMarketStarted == 1, "Market has not started");
        require(LibMeta.msgSender() == LibERC721._ownerOf(id), "Only owners can do");
        s.Market[id].price = setPrice;
        s.Market[id].state = TokenState.ForSale;
        emit ForSale(id,setPrice);
    }

    function cancelTokenSale(uint256 id) external override{
        require(s.isMarketStarted == 1, "Market has not started");
        require(LibMeta.msgSender() == LibERC721._ownerOf(id), "Only owners can do");
        LibMarket._cancelSale(id);
        emit CancelSale(id);
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
}
