pragma solidity ^0.4.24;

import "./base/BaseToken.sol";


contract GastroAdvisorToken is BaseToken {

  uint256 public lockedUntil;
  mapping(address => uint256) lockedBalances;

  modifier canTransfer() {
    require(mintingFinished);
    _;
  }

  constructor()
  BaseToken("GastroAdvisorToken", "FORK", 18)
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
