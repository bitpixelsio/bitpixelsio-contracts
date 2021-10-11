// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import {LibERC721} from "../libraries/LibERC721.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibMarket.sol";
import "../libraries/LibRent.sol";
import "../tokens/ERC721Diamond.sol";

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
        require(xCoordLeft >= 0, "x Left should be positive");
        require(yCoordTop >= 0, "y Top should be positive");
        require(width >= 1, "x Right should be positive");
        require(height >= 1, "x Bottom should be positive");
        require(xCoordLeft < 100, "x Left is so high");
        require(xCoordLeft + width < 101, "Width is so high");
        require(yCoordTop < 100, "y Top is so high");
        require(yCoordTop + height < 101, "Height is so high");
        require(width > 0, "Wrong width");
        require(height > 0, "Wrong height");
        uint256 amount = width * height;
        require(amount <= 50, "Can only mint up to 50");
        require(amount > 0, "Nothing to mint");
        require(totalSupply() + amount < 10001, "Max supply exceeded");
        require(AppConstants.publicPrice * amount <= msg.value, "AVAX value sent is too low");

        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i;
                require(!_exists(tokenId), "ERC721: token already minted");
            }
        }
        for (uint256 i = xCoordLeft; i < xCoordLeft + width; i++) {
            for (uint256 j = yCoordTop; j < yCoordTop + height; j++) {
                uint256 tokenId = j * 100 + i;
                _safeMint(LibMeta.msgSender(), tokenId);
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
        }
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if(address(this) == operator){
            return true;
        }
        return super.isApprovedForAll(owner, operator);
    }
}
