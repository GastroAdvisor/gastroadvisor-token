pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";


contract ForkTimelock is TokenTimelock {

  constructor(
    ERC20Basic _token,
    address _beneficiary,
    uint256 _releaseTime
  )
  TokenTimelock(_token, _beneficiary, _releaseTime)
  public
  {}
}
