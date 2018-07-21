pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/rbac/RBAC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Contributions is RBAC, Ownable {
  using SafeMath for uint256;

  string public constant ROLE_MINTER = "minter";

  modifier onlyMinter () {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  mapping(address => uint256) public tokenBalances;
  mapping(address => uint256) public ethContributions;
  address[] public addresses;

  constructor() public {}

  function addBalance(address _address, uint256 _weiAmount, uint256 _tokenAmount) onlyMinter public {
    if (ethContributions[_address] == 0) {
      addresses.push(_address);
    }
    ethContributions[_address] = ethContributions[_address].add(_weiAmount);
    tokenBalances[_address] = tokenBalances[_address].add(_tokenAmount);
  }

  /**
   * @dev add a minter role to an address
   * @param minter address
   */
  function addMinter(address minter) onlyOwner public {
    addRole(minter, ROLE_MINTER);
  }

  /**
   * @dev remove a minter role from an address
   * @param minter address
   */
  function removeMinter(address minter) onlyOwner public {
    removeRole(minter, ROLE_MINTER);
  }

  function getContributorsLength() view public returns (uint) {
    return addresses.length;
  }
}
