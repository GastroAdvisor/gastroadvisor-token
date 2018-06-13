pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC827/ERC827Token.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


contract GastroAdvisorToken is DetailedERC20, ERC827Token, RBACMintableToken, BurnableToken {

  modifier canTransfer() {
    require(mintingFinished);
    _;
  }

  constructor()
  DetailedERC20("GastroAdvisorToken", "FORK", 18)
  public
  {}

  function transfer(address _to, uint256 _value) canTransfer public returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) canTransfer public returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function transferAndCall(
    address _to,
    uint256 _value,
    bytes _data)
  canTransfer public payable returns (bool)
  {
    return super.transferAndCall(_to, _value, _data);
  }

  function transferFromAndCall(
    address _from,
    address _to,
    uint256 _value,
    bytes _data)
  canTransfer public payable returns (bool)
  {
    return super.transferFromAndCall(
      _from,
      _to,
      _value,
      _data
    );
  }

  function transferAnyERC20Token(address _tokenAddress, uint256 _tokens) onlyOwner public returns (bool success) {
    return ERC20Basic(_tokenAddress).transfer(owner, _tokens);
  }
}
