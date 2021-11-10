// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMarketPlace {
    struct MarketData {
        uint256 price;
        TokenState state;
    }//old struct not used
    enum TokenState {Pending, ForSale, Sold, Neutral}//old enum not used

    struct MarketDataV2 {
        uint256[] pixels;
        uint256 totalPrice;
    }

    struct MarketDataRead{
        uint256[] pixels;
        uint256 totalPrice;
        uint256 groupId;
    }

    event MarketBuy(uint256 indexed pixelId, uint256 price);
    event MarketList(uint256 indexed pixelId, uint256 price, uint256 groupId);
    event MarketCancel(uint256 indexed pixelId);

    function getFeeReceiver() external view returns(address payable);
    function getFeePercentage() external view returns(uint256);
    function setFeePercentage(uint256 _feePercentage) external;
    function setFeeReceiver(address _feeReceiver) external;
    function buyMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external payable;
    function setPriceMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height, uint256 totalPrice) external;
    function cancelMarket(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external;
    function getMarketData(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) external view returns(MarketDataRead[] memory);
}
