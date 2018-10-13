const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');
const { duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');

const { shouldBehaveLikeDefaultCrowdsale } = require('./base/DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkPreIco = artifacts.require('ForkPreIco');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

const ROLE_MINTER = 'minter';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('ForkPreIco', function ([owner, investor, wallet, purchaser, thirdParty]) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  const rate = new BigNumber(10);
  const tokenDecimals = 18;
  const tokenCap = (new BigNumber(100)).mul(Math.pow(10, tokenDecimals));
  const minimumContribution = ether(0.2);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.lockedUntil = (await latestTime()) + duration.weeks(1);

    this.token = await GastroAdvisorToken.new(
      _name,
      _symbol,
      _decimals,
      this.lockedUntil,
      { from: owner }
    );
    this.contributions = await Contributions.new();
    this.crowdsale = await ForkPreIco.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      tokenCap,
      minimumContribution,
      this.token.address,
      this.contributions.address
    );

    await this.token.addMinter(this.crowdsale.address);
    await this.contributions.addOperator(this.crowdsale.address);
  });

  context('like a DefaultCrowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a ForkPreIco', function () {
    describe('creating a valid crowdsale', function () {
      it('should be token minter', async function () {
        const isMinter = await this.token.hasRole(this.crowdsale.address, ROLE_MINTER);
        isMinter.should.equal(true);
      });

      it('tokenCap should be right set', async function () {
        const currentTokenCap = await this.crowdsale.tokenCap();
        currentTokenCap.should.be.bignumber.equal(tokenCap);
      });

      it('should fail with zero rate', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.openingTime,
            this.closingTime,
            0,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if wallet is the zero address', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.openingTime,
            this.closingTime,
            rate,
            ZERO_ADDRESS,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if token is the zero address', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            ZERO_ADDRESS,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is in the past', async function () {
        await assertRevert(
          ForkPreIco.new(
            (await latestTime()) - duration.seconds(1),
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is after closing time in the past', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.closingTime,
            this.openingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if contributions is the zero address', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            ZERO_ADDRESS
          )
        );
      });

      it('should fail with zero tokenCap', async function () {
        await assertRevert(
          ForkPreIco.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            0,
            minimumContribution,
            this.token.address,
            this.contributions.address
          )
        );
      });
    });
  });
});
