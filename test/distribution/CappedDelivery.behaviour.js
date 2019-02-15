const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeCappedDelivery (accounts, cap, allowMultipleSend) {
  const [
    tokenOwner,
    cappedDeliveryOwner,
    anotherAccount,
    thirdParty,
    ...receivers
  ] = accounts;

  const addresses = receivers;
  const amounts = [];
  for (const arrayIndex in addresses) {
    amounts.push(new BigNumber(100 * arrayIndex));
  }

  context('after creation', function () {
    describe('if valid', function () {
      it('has a valid token', async function () {
        const deliveryToken = await this.cappedDelivery.token();
        assert.equal(deliveryToken, this.token.address);
      });

      it('has a valid cap', async function () {
        const deliveryCap = await this.cappedDelivery.cap();
        deliveryCap.should.be.bignumber.equal(cap);
      });

      it('has a valid allowMultipleSend', async function () {
        const deliveryAllowMultipleSend = await this.cappedDelivery.allowMultipleSend();
        deliveryAllowMultipleSend.should.be.equal(allowMultipleSend);
      });
    });
  });

  context('sending tokens', function () {
    describe('if owner is calling', function () {
      it('should transfer tokens for given addresses', async function () {
        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

          const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
          receiverBalance.should.be.bignumber.equal(expectedTokens);
        }
      });

      it('should increase receivedTokens', async function () {
        for (const arrayIndex in addresses) {
          const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

        for (const arrayIndex in addresses) {
          const receivedTokens = await this.cappedDelivery.receivedTokens(addresses[arrayIndex]);

          const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
          receivedTokens.should.be.bignumber.equal(expectedTokens);
        }
      });

      it('should increase distributedTokens', async function () {
        let totalGivenTokens = new BigNumber(0);

        await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

        for (const arrayIndex in amounts) {
          totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex].mul(Math.pow(10, 18)));
        }
        const distributedTokens = await this.cappedDelivery.distributedTokens();
        distributedTokens.should.be.bignumber.equal(totalGivenTokens);
      });

      it('should decrease remainingTokens', async function () {
        let totalGivenTokens = new BigNumber(0);

        await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

        for (const arrayIndex in amounts) {
          totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex].mul(Math.pow(10, 18)));
        }
        const remainingTokens = await this.cappedDelivery.remainingTokens();
        remainingTokens.should.be.bignumber.equal(
          cap.sub(totalGivenTokens)
        );
      });

      describe(`calling twice with allowMultipleSend equal to ${allowMultipleSend}`, function () {
        if (allowMultipleSend) {
          it('should transfer tokens for given addresses', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
              receiverBalance.should.be.bignumber.equal(expectedTokens.mul(2));
            }
          });

          it('should increase receivedTokens', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in addresses) {
              const receivedTokens = await this.cappedDelivery.receivedTokens(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
              receivedTokens.should.be.bignumber.equal(expectedTokens.mul(2));
            }
          });

          it('should increase distributedTokens', async function () {
            let totalGivenTokens = new BigNumber(0);

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in amounts) {
              totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex]);
            }
            const distributedTokens = await this.cappedDelivery.distributedTokens();
            distributedTokens.should.be.bignumber.equal(totalGivenTokens.mul(2).mul(Math.pow(10, 18)));
          });
        } else {
          it('should not transfer tokens for given addresses', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
              receiverBalance.should.be.bignumber.equal(expectedTokens);
            }
          });

          it('should not increase receivedTokens', async function () {
            for (const arrayIndex in addresses) {
              const receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
              receiverBalance.should.be.bignumber.equal(0);
            }

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in addresses) {
              const receivedTokens = await this.cappedDelivery.receivedTokens(addresses[arrayIndex]);

              const expectedTokens = amounts[arrayIndex].mul(Math.pow(10, 18));
              receivedTokens.should.be.bignumber.equal(expectedTokens);
            }
          });

          it('should not increase distributedTokens', async function () {
            let totalGivenTokens = new BigNumber(0);

            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });
            await this.cappedDelivery.multiSend(addresses, amounts, { from: cappedDeliveryOwner });

            for (const arrayIndex in amounts) {
              totalGivenTokens = totalGivenTokens.plus(amounts[arrayIndex].mul(Math.pow(10, 18)));
            }
            const distributedTokens = await this.cappedDelivery.distributedTokens();
            distributedTokens.should.be.bignumber.equal(totalGivenTokens);
          });
        }
      });

      describe('if sending more than the cap', function () {
        it('reverts', async function () {
          const moreThanTheCap = cap.add(1);
          await assertRevert(
            this.cappedDelivery.multiSend([addresses[1]], [moreThanTheCap], { from: cappedDeliveryOwner })
          );
        });
      });

      describe('if addresses are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.cappedDelivery.multiSend([], amounts, { from: cappedDeliveryOwner })
          );
        });
      });

      describe('if amounts are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.cappedDelivery.multiSend(addresses, [], { from: cappedDeliveryOwner })
          );
        });
      });

      describe('if amounts length is not equal to addresses length', function () {
        it('reverts', async function () {
          await assertRevert(
            this.cappedDelivery.multiSend([addresses[0]], [amounts[0], amounts[1]], { from: cappedDeliveryOwner })
          );
        });
      });
    });

    describe('if token owner is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.cappedDelivery.multiSend(addresses, amounts, { from: tokenOwner })
        );
      });
    });

    describe('if another account is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.cappedDelivery.multiSend(addresses, amounts, { from: anotherAccount })
        );
      });
    });
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.cappedDelivery;
    });

    shouldBehaveLikeTokenRecover([cappedDeliveryOwner, thirdParty]);
  });
}

module.exports = {
  shouldBehaveLikeCappedDelivery,
};
