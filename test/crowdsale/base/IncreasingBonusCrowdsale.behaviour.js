const { ether } = require('../../helpers/ether');
const { increaseTimeTo } = require('../../helpers/increaseTime');
const { assertRevert } = require('../../helpers/assertRevert');

const { shouldBehaveLikeDefaultCrowdsale } = require('./DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeIncreasingBonusCrowdsale ([owner, investor, wallet, purchaser, thirdParty], rate) {
  context('like a Default Crowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a Increasing Bonus Crowdsale', function () {
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

    describe('setting bonus ranges and values', function () {
      describe('if owner is calling', function () {
        it('success', async function () {
          await this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner });
        });

        it('should set right values', async function () {
          await this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner });

          for (let i = 0; i < bonusRanges.length; i++) {
            (await this.crowdsale.bonusRanges(i)).should.be.bignumber.equal(bonusRanges[i]);
          }

          for (let i = 0; i < bonusValues.length; i++) {
            (await this.crowdsale.bonusValues(i)).should.be.bignumber.equal(bonusValues[i]);
          }
        });

        describe('calling twice', function () {
          it('reverts', async function () {
            await this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner });
            await assertRevert(
              this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner })
            );
          });
        });

        describe('high-level purchase', function () {
          beforeEach(async function () {
            await this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner });
            await increaseTimeTo(this.openingTime);
          });

          it('should log purchase', async function () {
            for (let i = 0; i < bonusRanges.length; i++) {
              const value = bonusRanges[i] > 0 ? bonusRanges[i] : ether(0.1); // lower range
              const normalAmount = value.mul(rate);
              const bonusAmount = normalAmount.mul(bonusValues[i]).div(100);
              const expectedTokenAmount = normalAmount.add(bonusAmount);
              const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
              const event = logs.find(e => e.event === 'TokenPurchase');
              should.exist(event);
              event.args.purchaser.should.equal(investor);
              event.args.beneficiary.should.equal(investor);
              event.args.value.should.be.bignumber.equal(value);
              event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
            }
          });
        });

        describe('low-level purchase', function () {
          beforeEach(async function () {
            await this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: owner });
            await increaseTimeTo(this.openingTime);
          });

          it('should log purchase', async function () {
            for (let i = 0; i < bonusRanges.length; i++) {
              const value = bonusRanges[i] > 0 ? bonusRanges[i] : ether(0.1); // lower range
              const normalAmount = value.mul(rate);
              const bonusAmount = normalAmount.mul(bonusValues[i]).div(100);
              const expectedTokenAmount = normalAmount.add(bonusAmount);
              const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
              const event = logs.find(e => e.event === 'TokenPurchase');
              should.exist(event);
              event.args.purchaser.should.equal(purchaser);
              event.args.beneficiary.should.equal(investor);
              event.args.value.should.be.bignumber.equal(value);
              event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
            }
          });
        });
      });

      describe('if third party is calling', function () {
        it('reverts', async function () {
          await assertRevert(
            this.crowdsale.setBonusRates(bonusRanges, bonusValues, { from: thirdParty })
          );
        });
      });
    });

    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });
    });

    describe('low-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeIncreasingBonusCrowdsale,
};
