// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMarketPlace {
    struct MarketData {
        uint256 price;
        TokenState state;
    }
    enum TokenState {Pending, ForSale, Sold, Neutral}

    event Bought(uint256 indexed tokenId, uint256 value);
    event ForSale(uint256 indexed id, uint256 price);
    event CancelSale(uint256 indexed id);

    function getMarketData(uint256 tokenId) external view returns(MarketData memory);
    function getFeeReceiver() external view returns(address payable);
    function getFeePercentage() external view returns(uint256);
    function buy(uint256 _tokenId) external payable;
    function setTokenPrice(uint256 id, uint256 setPrice) external;
    function cancelTokenSale(uint256 id) external;
    function setFeePercentage(uint256 _feePercentage) external;
    function setFeeReceiver(address _feeReceiver) external;
}
