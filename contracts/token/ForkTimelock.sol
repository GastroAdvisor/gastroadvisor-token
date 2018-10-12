pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";


/**
 * @title ForkTimelock
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Extends from TokenTimelock which is a token holder contract that will allow a
 *  beneficiary to extract the tokens after a given release time
 */
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
