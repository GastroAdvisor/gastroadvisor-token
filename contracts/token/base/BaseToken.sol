pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "erc-payable-token/contracts/token/ERC1363/ERC1363BasicToken.sol";
import "eth-token-recover/contracts/TokenRecover.sol";


contract BaseToken is DetailedERC20, RBACMintableToken, BurnableToken, ERC1363BasicToken, TokenRecover { // solium-disable-line max-len
  constructor(
    string _name,
    string _symbol,
    uint8 _decimals
  )
  DetailedERC20(_name, _symbol, _decimals)
  public
  {}
}