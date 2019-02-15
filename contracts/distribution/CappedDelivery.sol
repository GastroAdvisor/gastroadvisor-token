pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "eth-token-recover/contracts/TokenRecover.sol";
import "../token/GastroAdvisorToken.sol";


/**
 * @title CappedDelivery
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Contract to distribute tokens by transfer function
 */
contract CappedDelivery is TokenRecover {

  using SafeMath for uint256;

  // the token to distribute
  ERC20 internal _token;

  // the max token cap to distribute
  uint256 private _cap;

  // if multiple sends to the same address are allowed
  bool private _allowMultipleSend;

  // the sum of distributed tokens
  uint256 private _distributedTokens;

  // map of address and received token amount
  mapping (address => uint256) private _receivedTokens;

  /**
   * @param token Address of the token being distributed
   * @param cap Max amount of token to be distributed
   * @param allowMultipleSend Allow multiple send to same address
   */
  constructor(address token, uint256 cap, bool allowMultipleSend) public {
    require(token != address(0));
    require(cap > 0);

    _token = ERC20(token);
    _cap = cap;
    _allowMultipleSend = allowMultipleSend;
  }

  /**
   * @return the token to distribute
   */
  function token() public view returns(ERC20) {
    return _token;
  }

  /**
   * @return the max token cap to distribute
   */
  function cap() public view returns(uint256) {
    return _cap;
  }

  /**
   * @return if multiple sends to the same address are allowed
   */
  function allowMultipleSend() public view returns(bool) {
    return _allowMultipleSend;
  }

  /**
   * @return the sum of distributed tokens
   */
  function distributedTokens() public view returns(uint256) {
    return _distributedTokens;
  }

  /**
   * @param account The address to check
   * @return received token amount for the given address
   */
  function receivedTokens(address account) public view returns(uint256) {
    return _receivedTokens[account];
  }

  /**
   * @dev return the number of remaining tokens to distribute
   * @return uint256
   */
  function remainingTokens() public view returns(uint256) {
    return _cap.sub(_distributedTokens);
  }

  /**
   * @dev send tokens
   * @param accounts Array of addresses being distributing
   * @param amounts Array of amounts of token distributed
   */
  function multiSend(address[] accounts, uint256[] amounts) public onlyOwner {
    require(accounts.length > 0);
    require(amounts.length > 0);
    require(accounts.length == amounts.length);

    for (uint i = 0; i < accounts.length; i++) {
      address account = accounts[i];
      uint256 amount = amounts[i] * 10 ** 18;

      if (_allowMultipleSend || _receivedTokens[account] == 0) {
        _receivedTokens[account] = _receivedTokens[account].add(amount);
        _distributedTokens = _distributedTokens.add(amount);

        require(_distributedTokens <= _cap);

        _distributeTokens(account, amount);
      }
    }
  }

  /**
   * @dev distribute tokens
   * @param account Address being distributing
   * @param amount Amount of token distributed
   */
  function _distributeTokens(address account, uint256 amount) internal {
    _token.transfer(account, amount);
  }
}
