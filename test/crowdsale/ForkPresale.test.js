const { advanceBlock } = require('../helpers/advanceToBlock');
const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { assertRevert } = require('../helpers/assertRevert');

const { shouldBehaveLikePostDeliveryCrowdsale } = require('./base/PostDeliveryCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkPresale = artifacts.require('ForkPresale');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

const ROLE_MINTER = 'minter';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('ForkPresale', function ([owner, investor, wallet, purchaser, thirdParty]) {
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
    this.crowdsale = await ForkPresale.new(
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

  context('like a PostDelivery Crowdsale', function () {
    shouldBehaveLikePostDeliveryCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a ForkPresale', function () {
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
          ForkPresale.new(
            this.openingTime,
            this.closingTime,
            0,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if wallet is the zero address', async function () {
        await assertRevert(
          ForkPresale.new(
            this.openingTime,
            this.closingTime,
            rate,
            ZERO_ADDRESS,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if token is the zero address', async function () {
        await assertRevert(
          ForkPresale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            ZERO_ADDRESS,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is in the past', async function () {
        await assertRevert(
          ForkPresale.new(
            (await latestTime()) - duration.seconds(1),
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is after closing time in the past', async function () {
        await assertRevert(
          ForkPresale.new(
            this.closingTime,
            this.openingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if contributions is the zero address', async function () {
        await assertRevert(
          ForkPresale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            ZERO_ADDRESS
          )
        );
      });

      it('should fail with zero tokenCap', async function () {
        await assertRevert(
          ForkPresale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            0,
            this.token.address,
            this.contributions.address
          )
        );
      });
    });
  });
});