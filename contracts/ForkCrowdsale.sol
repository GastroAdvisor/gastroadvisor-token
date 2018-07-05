pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";

import "./GastroAdvisorToken.sol";
import "./Contributions.sol";


contract ForkCrowdsale is TimedCrowdsale, MintedCrowdsale, Ownable {

  Contributions public contributions;

  uint256 public cap;

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    address _token,
    address _contributions
  )
  TimedCrowdsale(_startTime, _endTime)
  Crowdsale(_rate, _wallet, ERC20(_token))
  public
  {
    require(_contributions != address(0));
    require(_tokenCap != 0);

    cap = (_tokenCap * (10 ** 18)).div(_rate);

    contributions = Contributions(_contributions);
  }

  // false if the ico is not started, true if the ico is started and running, true if the ico is completed
  function started() public view returns(bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= openingTime;
  }

  // false if the ico is not started, false if the ico is started and running, true if the ico is completed
  function ended() public view returns(bool) {
    return hasClosed() || capReached();
  }

  /**
   * @dev Checks whether the cap has been reached.
   * @return Whether the cap was reached
   */
  function capReached() public view returns (bool) {
    return weiRaised >= cap;
  }

  function transferAnyERC20Token(address _tokenAddress, uint256 _tokens) onlyOwner public returns (bool success) {
    return ERC20Basic(_tokenAddress).transfer(owner, _tokens);
  }

  /**
   * @dev Extend parent behavior to add contributions log
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    super._deliverTokens(_beneficiary, _tokenAmount);
    contributions.addBalance(_beneficiary, _tokenAmount);
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the funding cap.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(weiRaised.add(_weiAmount) <= cap);
  }
}
