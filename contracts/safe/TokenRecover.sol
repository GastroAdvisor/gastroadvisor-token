pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract TokenRecover is Ownable {
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
