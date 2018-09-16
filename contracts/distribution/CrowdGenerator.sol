pragma solidity ^0.4.24;

import "../crowdsale/ForkCrowdsale.sol";


contract CrowdGenerator is TokenRecover {

  uint256 public endTime;
  uint256 public rate;
  address public wallet;
  uint256 public tokenCap;
  address public token;
  address public contributions;

  address[] public crowdsaleList;

  event CrowdsaleStarted(
    address indexed crowdsale
  );

  constructor(
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    address _token,
    address _contributions
  ) public {
    // solium-disable-next-line security/no-block-members
    require(_endTime >= block.timestamp);
    require(_rate > 0);
    require(_wallet != address(0));
    require(_tokenCap > 0);
    require(_token != address(0));
    require(_contributions != address(0));

    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
    tokenCap = _tokenCap;
    token = _token;
    contributions = _contributions;
  }

  function startCrowdsales(uint256 _number) public onlyOwner {
    for (uint256 i = 0; i < _number; i++) {
      ForkCrowdsale crowd = new ForkCrowdsale(
        block.timestamp, // solium-disable-line security/no-block-members
        endTime,
        rate,
        wallet,
        tokenCap,
        token,
        contributions
      );

      crowd.transferOwnership(msg.sender);
      crowdsaleList.push(address(crowd));
      emit CrowdsaleStarted(address(crowd));
    }
  }

  function getCrowdsalesLength() public view returns (uint) {
    return crowdsaleList.length;
  }
}
