// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRentablePixel.sol";
import "../interfaces/IMarketPlace.sol";

library AppConstants{
    uint256 constant isTestMode = 1;
    uint256 constant publicPrice = isTestMode == 1 ? 1000000000000000 : 1000000000000000000; // 1 AVAX
    uint256 constant dayInSeconds = isTestMode == 1 ? 1 : 86400;
}

struct AppStorage {
    //ERC721
    string _name;
    string _symbol;
    mapping(uint256 => address) _owners;
    mapping(address => uint256) _balances;
    mapping(uint256 => address) _tokenApprovals;
    mapping(address => mapping(address => bool)) _operatorApprovals;
    //ERC721Enumerable
    mapping(address => mapping(uint256 => uint256)) _ownedTokens;
    mapping(uint256 => uint256) _ownedTokensIndex;
    uint256[] _allTokens;
    mapping(uint256 => uint256) _allTokensIndex;
    //ERC721URIStorage
    mapping(uint256 => string) _tokenURIs;

    uint256 isSaleStarted;
    string baseUri;

    mapping(uint256 => IRentablePixel.RentData[]) RentStorage;
    mapping(address => uint256) totalLockedValueByAddress;
    uint256 totalLockedValue;

    mapping(uint256 => IMarketPlace.MarketData) Market;
    address payable feeReceiver;
    uint256 feePercentage;
    uint32 isRentStarted;
    uint32 isMarketStarted;

    uint32 limitMinDaysToRent;
    uint32 limitMaxDaysToRent;
    uint32 limitMinDaysBeforeRentCancel;
    uint32 limitMaxDaysForRent;
}

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x >= 0 ? x : -x);
    }
}
