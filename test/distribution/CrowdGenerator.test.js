const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');
const { duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkPreIco = artifacts.require('ForkPreIco');
const CrowdGenerator = artifacts.require('CrowdGenerator');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('CrowdGenerator', function ([owner, wallet, thirdParty]) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  const rate = new BigNumber(10);
  const tokenDecimals = 18;
  const tokenCap = (new BigNumber(100)).mul(Math.pow(10, tokenDecimals));
  const minimumContribution = ether(0.2);

  const bonusRanges = [
    ether(1),
    ether(0.6),
    ether(0.3),
    ether(0),
  ];

  const bonusValues = [
    new BigNumber(100),
    new BigNumber(90),
    new BigNumber(70),
    new BigNumber(50),
  ];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.closingTime = (await latestTime()) + duration.weeks(1);
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

    this.generator = await CrowdGenerator.new(
      this.closingTime,
      rate,
      wallet,
      tokenCap,
      minimumContribution,
      this.token.address,
      this.contributions.address,
      bonusRanges,
      bonusValues
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
          minimumContribution,
          this.token.address,
          this.contributions.address,
          bonusRanges,
          bonusValues
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
          minimumContribution,
          this.token.address,
          this.contributions.address,
          bonusRanges,
          bonusValues
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
          minimumContribution,
          ZERO_ADDRESS,
          this.contributions.address,
          bonusRanges,
          bonusValues
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
          minimumContribution,
          this.token.address,
          this.contributions.address,
          bonusRanges,
          bonusValues
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
          minimumContribution,
          this.token.address,
          ZERO_ADDRESS,
          bonusRanges,
          bonusValues
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
          minimumContribution,
          this.token.address,
          this.contributions.address,
          bonusRanges,
          bonusValues
        )
      );
    });

    describe('if ranges and values have different length', function () {
      it('reverts', async function () {
        const br = [
          ether(1),
          ether(0.6),
        ];

        const bv = [
          new BigNumber(100),
          new BigNumber(90),
        ];

        await assertRevert(
          CrowdGenerator.new(
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address,
            br,
            bonusValues,
          )
        );

        await assertRevert(
          CrowdGenerator.new(
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address,
            bonusRanges,
            bv,
          )
        );
      });
    });

    describe('if ranges are ordered reverse', function () {
      const br = [
        ether(0),
        ether(0.3),
        ether(0.6),
        ether(1),
      ];

      it('reverts', async function () {
        await assertRevert(
          CrowdGenerator.new(
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address,
            br,
            bonusValues,
          )
        );
      });
    });

    describe('if values are ordered reverse', function () {
      const bv = [
        new BigNumber(50),
        new BigNumber(70),
        new BigNumber(90),
        new BigNumber(100),
      ];

      it('reverts', async function () {
        await assertRevert(
          CrowdGenerator.new(
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            minimumContribution,
            this.token.address,
            this.contributions.address,
            bonusRanges,
            bv,
          )
        );
      });
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
        const crowdsale = ForkPreIco.at(crowdsaleAddress);
        (await crowdsale.owner()).should.be.equal(owner);
      });

      it('crowdsale values should be right set', async function () {
        await this.generator.startCrowdsales(1, { from: owner });

        const crowdsaleAddress = await this.generator.crowdsaleList(0);
        const crowdsale = ForkPreIco.at(crowdsaleAddress);

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
