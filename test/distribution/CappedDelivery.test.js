const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');

const { shouldBehaveLikeCappedDelivery } = require('./CappedDelivery.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CappedDelivery = artifacts.require('CappedDelivery');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('CappedDelivery', function (accounts) {
  const [
    tokenOwner,
    cappedDeliveryOwner,
    receiver,
  ] = accounts;

  const name = 'GastroAdvisorToken';
  const symbol = 'FORK';
  const decimals = 18;
  const tokenCap = (new BigNumber(100000)).mul(Math.pow(10, decimals));

  const cap = (new BigNumber(20000)).mul(Math.pow(10, decimals));

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.lockedUntil = (await latestTime()) + duration.weeks(1);
    this.token = await GastroAdvisorToken.new(name, symbol, decimals, tokenCap, this.lockedUntil, { from: tokenOwner });
  });

  const testingDelivery = function (allowMultipleSend) {
    context('creating a valid delivery', function () {
      describe('if token address is the zero address', function () {
        it('reverts', async function () {
          await assertRevert(
            CappedDelivery.new(ZERO_ADDRESS, cap, allowMultipleSend, { from: cappedDeliveryOwner })
          );
        });
      });

      describe('if cap is zero', function () {
        it('reverts', async function () {
          await assertRevert(
            CappedDelivery.new(this.token.address, 0, allowMultipleSend, { from: cappedDeliveryOwner })
          );
        });
      });

      context('testing behaviours', function () {
        beforeEach(async function () {
          this.cappedDelivery = await CappedDelivery.new(
            this.token.address,
            cap,
            allowMultipleSend,
            { from: cappedDeliveryOwner }
          );

          await this.token.mint(this.cappedDelivery.address, tokenCap, { from: tokenOwner });
        });

        describe('sending tokens if minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(
              this.cappedDelivery.multiSend([receiver], [100], { from: cappedDeliveryOwner })
            );
          });
        });

        context('like a CappedDelivery', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: tokenOwner });
          });

          shouldBehaveLikeCappedDelivery(accounts, cap, allowMultipleSend);
        });
      });
    });
  };

  context('if allowing multiple send', function () {
    const allowMultipleSend = true;
    testingDelivery(allowMultipleSend);
  });

  context('if not allowing multiple send', function () {
    const allowMultipleSend = false;
    testingDelivery(allowMultipleSend);
  });
});
