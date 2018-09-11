pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";

import "./ERC1363/ERC1363BasicToken.sol";


contract GastroAdvisorToken is DetailedERC20, RBACMintableToken, BurnableToken, ERC1363BasicToken { // solium-disable-line max-len

  modifier canTransfer() {
    require(mintingFinished);
    _;
  }

  constructor()
  DetailedERC20("GastroAdvisorToken", "FORK", 18)
  ERC1363BasicToken()
  public
  {}

  function transfer(
    address _to,
    uint256 _value
  )
  public
  canTransfer
  returns (bool)
  {
    return super.transfer(_to, _value);
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
  public
  canTransfer
  returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }

  // it's a safe function allowing to recover any ERC20 sent into the contract for error
  function transferAnyERC20Token(
    address _tokenAddress,
    uint256 _tokens
  )
  public
  onlyOwner
  returns (bool success)
  {
    return ERC20Basic(_tokenAddress).transfer(owner, _tokens);
  }
}
