pragma solidity ^0.4.24;

import "../crowdsale/ForkRC.sol";


contract CrowdGenerator is TokenRecover {

  uint256[] public bonusRanges;
  uint256[] public bonusValues;

  uint256 public endTime;
  uint256 public rate;
  address public wallet;
  uint256 public tokenCap;
  address public token;
  address public contributions;
  uint256 public minimumContribution;

  address[] public crowdsaleList;

  event CrowdsaleStarted(
    address indexed crowdsale
  );

  constructor(
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    uint256 _minimumContribution,
    address _token,
    address _contributions,
    uint256[] _bonusRanges,
    uint256[] _bonusValues
  ) public {
    // solium-disable-next-line security/no-block-members
    require(_endTime >= block.timestamp);
    require(_rate > 0);
    require(_wallet != address(0));
    require(_tokenCap > 0);
    require(_token != address(0));
    require(_contributions != address(0));
    require(_bonusRanges.length == _bonusValues.length);

    for (uint256 i = 0; i < (_bonusValues.length - 1); i++) {
      require(_bonusValues[i] > _bonusValues[i + 1]);
      require(_bonusRanges[i] > _bonusRanges[i + 1]);
    }

    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
    tokenCap = _tokenCap;
    token = _token;
    minimumContribution = _minimumContribution;
    contributions = _contributions;
    bonusRanges = _bonusRanges;
    bonusValues = _bonusValues;
  }

  function startCrowdsales(uint256 _number) public onlyOwner {
    for (uint256 i = 0; i < _number; i++) {
      ForkRC crowd = new ForkRC(
        block.timestamp, // solium-disable-line security/no-block-members
        endTime,
        rate,
        wallet,
        tokenCap,
        minimumContribution,
        token,
        contributions
      );

      crowd.setBonusRates(bonusRanges, bonusValues);
      crowd.transferOwnership(msg.sender);
      crowdsaleList.push(address(crowd));
      emit CrowdsaleStarted(address(crowd));
    }
  }

  function getCrowdsalesLength() public view returns (uint) {
    return crowdsaleList.length;
  }
}
