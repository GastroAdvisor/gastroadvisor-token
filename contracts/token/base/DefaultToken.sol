pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "erc-payable-token/contracts/token/ERC1363/ERC1363BasicToken.sol";
import "eth-token-recover/contracts/TokenRecover.sol";


contract DefaultToken is DetailedERC20, RBACMintableToken, BurnableToken, ERC1363BasicToken, TokenRecover { // solium-disable-line max-len

  modifier canTransfer() {
    require(mintingFinished);
    _;
  }

  constructor(
    string _name,
    string _symbol,
    uint8 _decimals
  )
  DetailedERC20(_name, _symbol, _decimals)
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

  /**
   * @dev add a minter role to an array of addresses
   * @param _minters address[]
   */
  function addMinters(address[] _minters) public onlyOwner {
    require(_minters.length > 0);
    for (uint i = 0; i < _minters.length; i++) {
      addRole(_minters[i], ROLE_MINTER);
    }
  }
}
