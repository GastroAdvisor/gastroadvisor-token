const { advanceBlock } = require('../helpers/advanceToBlock');
const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');

const { shouldBehaveLikeDefaultCrowdsale } = require('./base/DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkCrowdsale = artifacts.require('ForkCrowdsale');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

contract('ForkCrowdsale', function ([owner, investor, wallet, purchaser, thirdParty]) {
  const rate = new BigNumber(10);
  const tokenDecimals = 18;
  const tokenCap = (new BigNumber(100)).mul(Math.pow(10, tokenDecimals));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await GastroAdvisorToken.new();
    this.contributions = await Contributions.new();
    this.crowdsale = await ForkCrowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      tokenCap,
      this.token.address,
      this.contributions.address
    );

    await this.token.addMinter(this.crowdsale.address);
    await this.contributions.addMinter(this.crowdsale.address);
  });

  context('like a DefaultCrowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });
});
