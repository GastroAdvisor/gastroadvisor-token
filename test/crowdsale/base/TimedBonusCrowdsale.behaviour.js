const { duration, increaseTimeTo } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');

const { shouldBehaveLikeDefaultCrowdsale } = require('./DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeTimedBonusCrowdsale ([owner, investor, wallet, purchaser, thirdParty], rate) {
  context('like a Default Crowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  const value = ether(0.2);

  beforeEach(async function () {
    this.bonusDatesStruct = {
      'firstPhase': this.openingTime + duration.weeks(2),
      'secondPhase': this.openingTime + duration.weeks(4),
    };

    this.bonusRatesStruct = {
      'firstPhase': new BigNumber(20),
      'secondPhase': new BigNumber(10),
    };

    this.bonusDatesArray = [
      this.bonusDatesStruct.firstPhase,
      this.bonusDatesStruct.secondPhase,
    ];

    this.bonusRatesArray = [
      this.bonusRatesStruct.firstPhase,
      this.bonusRatesStruct.secondPhase,
    ];
  });

  context('setting bonus rates', function () {
    describe('before opening time', function () {
      describe('if setting right values', function () {
        it('success', async function () {
          await this.crowdsale.setBonusRates(this.bonusDatesArray, this.bonusRatesArray).should.be.fulfilled;

          for (let i = 0; i < this.bonusDatesArray.length; i++) {
            const date = await this.crowdsale.bonusDates(i);
            const rate = await this.crowdsale.bonusRates(i);

            date.should.be.bignumber.equal(this.bonusDatesArray[i]);
            rate.should.be.bignumber.equal(this.bonusRatesArray[i]);
          }
        });
      });

      describe('if thirdParty is calling', function () {
        it('reverts', async function () {
          await assertRevert(
            this.crowdsale.setBonusRates(
              this.bonusDatesArray,
              this.bonusRatesArray,
              { from: thirdParty }
            )
          );
        });
      });

      describe('if unordered dates array', function () {
        it('reverts', async function () {
          const wrongBonusDatesArray = [
            this.bonusDatesStruct.secondPhase,
            this.bonusDatesStruct.firstPhase,
          ];

          await assertRevert(
            this.crowdsale.setBonusRates(wrongBonusDatesArray, this.bonusRatesArray)
          );
        });
      });

      describe('if wrong arrays length', function () {
        it('reverts', async function () {
          const wrongBonusDatesArray = [
            this.bonusDatesStruct.firstPhase,
          ];

          await assertRevert(
            this.crowdsale.setBonusRates(wrongBonusDatesArray, this.bonusRatesArray)
          );

          const wrongRatesArray = [
            new BigNumber(20),
          ];

          await assertRevert(
            this.crowdsale.setBonusRates(this.bonusDatesArray, wrongRatesArray)
          );

          await assertRevert(
            this.crowdsale.setBonusRates(wrongBonusDatesArray, wrongRatesArray)
          );
        });
      });
    });

    describe('after opening time', function () {
      it('reverts', async function () {
        await increaseTimeTo(this.openingTime);
        await assertRevert(
          this.crowdsale.setBonusRates(this.bonusDatesArray, this.bonusRatesArray)
        );
      });
    });
  });

  context('accepting payments', function () {
    beforeEach(async function () {
      await this.crowdsale.setBonusRates(this.bonusDatesArray, this.bonusRatesArray);
    });

    describe('in first phase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('user should have right tokens number', async function () {
        let userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = expectedTokens.mul(this.bonusRatesStruct.firstPhase).div(100);

        userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });

      it('should increase sold tokens', async function () {
        let soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = expectedTokens.mul(this.bonusRatesStruct.firstPhase).div(100);

        soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });
    });

    describe('in second phase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.bonusDatesStruct.firstPhase + duration.seconds(1));
      });

      it('user should have right tokens number', async function () {
        let userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = expectedTokens.mul(this.bonusRatesStruct.secondPhase).div(100);

        userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });

      it('should increase sold tokens', async function () {
        let soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = expectedTokens.mul(this.bonusRatesStruct.secondPhase).div(100);

        soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });
    });

    describe('in third phase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.bonusDatesStruct.secondPhase + duration.seconds(1));
      });

      it('user should have right tokens number', async function () {
        let userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = 0;

        userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });

      it('should increase sold tokens', async function () {
        let soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: investor });

        const expectedTokens = value.mul(rate);
        const expectedBonus = 0;

        soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });
    });

    describe('participating in each round', function () {
      it('user should have right tokens number', async function () {
        let userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(0);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        let currentExpectedTokens = value.mul(rate);
        let currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.firstPhase).div(100);
        let expectedTokens = currentExpectedTokens;
        let expectedBonus = currentExpectedBonus;

        await increaseTimeTo(this.bonusDatesStruct.firstPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.secondPhase).div(100);
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        await increaseTimeTo(this.bonusDatesStruct.secondPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = 0;
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        userBalance = await this.token.balanceOf(investor);
        userBalance.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });

      it('should increase sold tokens', async function () {
        let soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(0);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        let currentExpectedTokens = value.mul(rate);
        let currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.firstPhase).div(100);
        let expectedTokens = currentExpectedTokens;
        let expectedBonus = currentExpectedBonus;

        await increaseTimeTo(this.bonusDatesStruct.firstPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.secondPhase).div(100);
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        await increaseTimeTo(this.bonusDatesStruct.secondPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = 0;
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(expectedTokens.add(expectedBonus));
      });
    });

    describe('multiple users participating', function () {
      it('should increase sold tokens', async function () {
        let soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(0);

        await increaseTimeTo(this.openingTime);
        await this.crowdsale.buyTokens(investor, { value, from: investor });
        await this.crowdsale.buyTokens(purchaser, { value, from: purchaser });

        let currentExpectedTokens = value.mul(rate);
        let currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.firstPhase).div(100);
        let expectedTokens = currentExpectedTokens;
        let expectedBonus = currentExpectedBonus;

        await increaseTimeTo(this.bonusDatesStruct.firstPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });
        await this.crowdsale.buyTokens(purchaser, { value, from: purchaser });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = currentExpectedTokens.mul(this.bonusRatesStruct.secondPhase).div(100);
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        await increaseTimeTo(this.bonusDatesStruct.secondPhase);
        await this.crowdsale.buyTokens(investor, { value, from: investor });
        await this.crowdsale.buyTokens(purchaser, { value, from: purchaser });

        currentExpectedTokens = value.mul(rate);
        currentExpectedBonus = 0;
        expectedTokens = expectedTokens.add(currentExpectedTokens);
        expectedBonus = expectedBonus.add(currentExpectedBonus);

        soldTokens = await this.crowdsale.soldTokens();
        soldTokens.should.be.bignumber.equal(expectedTokens.add(expectedBonus).mul(2));
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeTimedBonusCrowdsale,
};
