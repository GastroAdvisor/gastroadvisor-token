const { advanceBlock } = require('../helpers/advanceToBlock');
const { duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { assertRevert } = require('../helpers/assertRevert');

const { shouldBehaveLikeTokenRecover } = require('../safe/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkCrowdsale = artifacts.require('ForkCrowdsale');
const CrowdGenerator = artifacts.require('CrowdGenerator');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('CrowdGenerator', function ([owner, wallet, thirdParty]) {
  const rate = new BigNumber(10);
  const tokenDecimals = 18;
  const tokenCap = (new BigNumber(100)).mul(Math.pow(10, tokenDecimals));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.closingTime = (await latestTime()) + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await GastroAdvisorToken.new();
    this.contributions = await Contributions.new();

    this.generator = await CrowdGenerator.new(
      this.closingTime,
      rate,
      wallet,
      tokenCap,
      this.token.address,
      this.contributions.address
    );
  });

  describe('creating a valid generator', function () {
    it('values should be right set', async function () {
      (await this.generator.endTime()).should.be.bignumber.equal(this.closingTime);
      (await this.generator.rate()).should.be.bignumber.equal(rate);
      (await this.generator.wallet()).should.be.equal(wallet);
      (await this.generator.tokenCap()).should.be.bignumber.equal(tokenCap);
      (await this.generator.token()).should.be.equal(this.token.address);
      (await this.generator.contributions()).should.be.equal(this.contributions.address);
    });

    it('should fail with zero rate', async function () {
      await assertRevert(
        CrowdGenerator.new(
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
        CrowdGenerator.new(
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
        CrowdGenerator.new(
          this.closingTime,
          rate,
          wallet,
          tokenCap,
          ZERO_ADDRESS,
          this.contributions.address
        )
      );
    });

    it('should fail if closing time is in the past', async function () {
      await assertRevert(
        CrowdGenerator.new(
          (await latestTime()) - duration.seconds(1),
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
        CrowdGenerator.new(
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
        CrowdGenerator.new(
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

  describe('creating crowdsales', function () {
    describe('if owner is calling', function () {
      it('success', async function () {
        await this.generator.startCrowdsales(2, { from: owner }).should.be.fulfilled;
      });

      it('crowdsales list length should be equal to number of creowdsale', async function () {
        await this.generator.startCrowdsales(2, { from: owner });
        await this.generator.startCrowdsales(2, { from: owner });

        (await this.generator.getCrowdsalesLength()).should.be.bignumber.equal(4);
      });

      it('owner should be crowdsale\'s owner', async function () {
        await this.generator.startCrowdsales(1, { from: owner });

        const crowdsaleAddress = await this.generator.crowdsaleList(0);
        const crowdsale = ForkCrowdsale.at(crowdsaleAddress);
        (await crowdsale.owner()).should.be.equal(owner);
      });

      it('crowdsale values should be right set', async function () {
        await this.generator.startCrowdsales(1, { from: owner });

        const crowdsaleAddress = await this.generator.crowdsaleList(0);
        const crowdsale = ForkCrowdsale.at(crowdsaleAddress);

        (await crowdsale.started()).should.be.equal(true);
        (await crowdsale.closingTime()).should.be.bignumber.equal(this.closingTime);
        (await crowdsale.rate()).should.be.bignumber.equal(rate);
        (await crowdsale.wallet()).should.be.equal(wallet);
        (await crowdsale.tokenCap()).should.be.bignumber.equal(tokenCap);
        (await crowdsale.token()).should.be.equal(this.token.address);
        (await crowdsale.contributions()).should.be.equal(this.contributions.address);
      });
    });

    describe('if third party is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.generator.startCrowdsales(2, { from: thirdParty })
        );
      });
    });
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.generator;
    });

    shouldBehaveLikeTokenRecover([owner, thirdParty]);
  });
});
