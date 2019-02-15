pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "eth-token-recover/contracts/TokenRecover.sol";

/**
 * @title GroupForkTimelock
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev GroupForkTimelock is a token holder contract that will allow a
 * group of beneficiaries to extract the tokens after a given release time
 */
contract GroupForkTimelock is TokenRecover {
  using SafeMath for uint256;
  using SafeERC20 for ERC20Basic;

  // ERC20 basic token contract being held
  ERC20Basic public token;

  // number of totals locked tokens
  uint256 public lockedTokens;

  // beneficiaries of tokens after they are released
  address[] public accounts;

  // amounts of tokens for each beneficiary
  mapping(address => uint256) public reservedTokens;

  // map of address and received token amount
  mapping (address => uint256) public receivedTokens;

  // timestamp when token release is enabled
  uint256 public releaseTime;

  constructor(
    ERC20Basic _token,
    address[] _accounts,
    uint256[] _amounts,
    uint256 _releaseTime
  )
    public
  {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    require(_accounts.length > 0);
    require(_amounts.length > 0);
    require(_accounts.length == _amounts.length);

    token = _token;
    accounts = _accounts;
    releaseTime = _releaseTime;

    for (uint i = 0; i < accounts.length; i++) {
      address account = accounts[i];
      uint256 amount = _amounts[i];

      reservedTokens[account] = amount;
      lockedTokens = lockedTokens.add(amount);
    }
  }

  /**
   * @notice Transfers tokens held by timelock to beneficiaries.
   */
  function release() public {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);

    uint256 balance = token.balanceOf(address(this));
    require(balance == lockedTokens);

    for (uint i = 0; i < accounts.length; i++) {
      address account = accounts[i];
      uint256 amount = reservedTokens[account];

      if (receivedTokens[account] == 0) {
        receivedTokens[account] = receivedTokens[account].add(amount);
        token.safeTransfer(account, amount);
      }
    }
  }
}
