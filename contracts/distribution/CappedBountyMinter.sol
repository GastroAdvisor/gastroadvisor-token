pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "eth-token-recover/contracts/TokenRecover.sol";


/**
 * @title CappedBountyMinter
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Contract to distribute bounty tokens
 */
contract CappedBountyMinter is TokenRecover {

  using SafeMath for uint256;

  ERC20 public token;

  uint256 public cap;
  uint256 public totalGivenBountyTokens;
  mapping (address => uint256) public givenBountyTokens;

  uint256 decimals = 18;

  constructor(ERC20 _token, uint256 _cap) public {
    require(_token != address(0));
    require(_cap > 0);

    token = _token;
    cap = _cap * (10 ** decimals);
  }

  function multiSend(
    address[] _addresses,
    uint256[] _amounts
  )
  public
  onlyOwner
  {
    require(_addresses.length > 0);
    require(_amounts.length > 0);
    require(_addresses.length == _amounts.length);

    for (uint i = 0; i < _addresses.length; i++) {
      address to = _addresses[i];
      uint256 value = _amounts[i] * (10 ** decimals);

      givenBountyTokens[to] = givenBountyTokens[to].add(value);
      totalGivenBountyTokens = totalGivenBountyTokens.add(value);

      require(totalGivenBountyTokens <= cap);

      require(MintableToken(address(token)).mint(to, value));
    }
  }

  function remainingTokens() public view returns(uint256) {
    return cap.sub(totalGivenBountyTokens);
  }
}
