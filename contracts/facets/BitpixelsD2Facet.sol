// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import {LibERC721} from "../libraries/LibERC721.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibMarket.sol";
import "../libraries/LibRent.sol";
import "../tokens/ERC721Diamond.sol";
import "../libraries/LibReflection.sol";

contract BitpixelsD2Facet is ERC721Diamond{
    constructor() {
    }

    function tokensOfOwner(address _owner) public view returns(uint256[] memory ) {
        return LibERC721._tokensOfOwner(_owner);
    }

    function setBaseUri(string memory newUri) public {
        LibDiamond.enforceIsContractOwner();
        s.baseUri = newUri;
    }

    function claim(uint256 xCoordLeft, uint256 yCoordTop, uint256 width, uint256 height) public payable {
        require(s.isSaleStarted == 1, "Sale has not started");
        uint256 amount = width * height;
        require(xCoordLeft >= 0 && yCoordTop >= 0 && width >= 1 && height >= 1 && xCoordLeft < 100 && xCoordLeft + width < 101 && yCoordTop < 100 && yCoordTop + height < 101 && amount <= 50, "Check Inputs");
        require(totalSupply() + amount < 10001, "Max supply exceeded");
        require(msg.sender == LibDiamond.diamondStorage().contractOwner || AppConstants.publicPrice * amount <= msg.value, "AVAX value sent is too low");

        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                if(LibERC721.isReserved(tokenId) == 1){
                    LibDiamond.enforceIsContractOwner();
                }else{
                    require(msg.sender != LibDiamond.diamondStorage().contractOwner, "Owner can't mint");
                }
                require(!_exists(tokenId), "ERC721: token already minted");
            }
        }
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i + 1;
                _safeMint(LibMeta.msgSender(), tokenId);
                s.lastDividendAt[tokenId] = s.totalDividend;
            }
        }
    }

    function withdraw() public {
        LibDiamond.enforceIsContractOwner();
        payable(LibMeta.msgSender()).transfer(address(this).balance);
    }

    function withdrawAmount(uint amount) public{
        LibDiamond.enforceIsContractOwner();
        payable(LibMeta.msgSender()).transfer(amount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return s.baseUri;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) override internal {
        super._beforeTokenTransfer(from, to, tokenId);
        if(to != address(0) && from != address(0)){
            LibMarket._cancelSale(tokenId);
            LibRent.claimRentCore(from);
            LibReflection._claimRewardInternal(tokenId);
        }
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if(address(this) == operator && s.isMarketStarted == 1){
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }
}
