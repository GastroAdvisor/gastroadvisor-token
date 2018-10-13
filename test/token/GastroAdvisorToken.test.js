const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent');
const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const { shouldBehaveLikeBaseToken } = require('./base/BaseToken.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const ERC1363Receiver = artifacts.require('ERC1363ReceiverMock.sol');

const ROLE_MINTER = 'minter';
const ROLE_OPERATOR = 'operator';
const RECEIVER_MAGIC_VALUE = '0x88a7ca5c';

contract('GastroAdvisorToken', function (
  [
    owner,
    anotherAccount,
    minter,
    operator,
    recipient,
    futureMinter,
    anotherFutureMinter,
    futureOperator,
    anotherFutureOperator,
    thirdParty,
  ]
) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  beforeEach(async function () {
    this.lockedUntil = (await latestTime()) + duration.weeks(1);
    this.afterLockedUntil = this.lockedUntil + duration.seconds(1);

    this.token = await GastroAdvisorToken.new(
      _name,
      _symbol,
      _decimals,
      this.lockedUntil,
      { from: owner }
    );
  });

  context('like a BaseToken', function () {
    shouldBehaveLikeBaseToken(
      [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty],
      [_name, _symbol, _decimals]
    );
  });

  context('GastroAdvisorToken behaviours', function () {
    const unlockedTokens = new BigNumber(1000);
    const lockedTokens = new BigNumber(2000);

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });

    describe('after creation', function () {
      it('owner should be token minter', async function () {
        const isMinter = await this.token.hasRole(owner, ROLE_MINTER);
        isMinter.should.equal(true);
      });

      it('owner should be token operator', async function () {
        const isOperator = await this.token.hasRole(owner, ROLE_OPERATOR);
        isOperator.should.equal(true);
      });
    });

    describe('check unlocking date', function () {
      it('should be set', async function () {
        (await this.token.lockedUntil()).should.be.bignumber.equal(this.lockedUntil);
      });
    });

    describe('mintAndLock', function () {
      describe('when the sender has the minting permission', function () {
        const from = minter;

        describe('when the token minting is not finished', function () {
          it('mintAndLock the requested amount', async function () {
            await this.token.mintAndLock(owner, lockedTokens, { from });

            const balance = await this.token.balanceOf(owner);
            balance.should.be.bignumber.equal(lockedTokens);
            const lockedBalance = await this.token.lockedBalanceOf(owner);
            lockedBalance.should.be.bignumber.equal(lockedTokens);
          });

          describe('if owner has also unlocked tokens', function () {
            it('balance and lockedBalance should be rigth set', async function () {
              await this.token.mint(owner, unlockedTokens, { from });
              await this.token.mintAndLock(owner, lockedTokens, { from });

              const balance = await this.token.balanceOf(owner);
              balance.should.be.bignumber.equal(lockedTokens.add(unlockedTokens));
              const lockedBalance = await this.token.lockedBalanceOf(owner);
              lockedBalance.should.be.bignumber.equal(lockedTokens);
            });
          });

          it('emits a mint and a transfer event', async function () {
            const { logs } = await this.token.mintAndLock(owner, lockedTokens, { from });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Mint');
            assert.equal(logs[0].args.to, owner);
            logs[0].args.amount.should.be.bignumber.equal(lockedTokens);
            assert.equal(logs[1].event, 'Transfer');
          });
        });

        describe('when the token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mintAndLock(owner, lockedTokens, { from }));
          });
        });
      });

      describe('when the sender has not the minting permission', function () {
        const from = anotherAccount;

        describe('when the token minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.mintAndLock(owner, lockedTokens, { from }));
          });
        });

        describe('when the token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mintAndLock(owner, lockedTokens, { from }));
          });
        });
      });
    });

    describe('before finish minting', function () {
      describe('trying to add operators', function () {
        describe('in normal conditions', function () {
          it('allows owner to add operator', async function () {
            await this.token.addOperator(futureOperator, { from: owner }).should.be.fulfilled;
          });

          it('allows owner to add operators', async function () {
            await this.token.addOperators(
              [futureOperator, anotherFutureOperator],
              { from: owner }
            ).should.be.fulfilled;
          });

          it('allows owner to remove an operator', async function () {
            await this.token.addOperator(futureOperator, { from: owner }).should.be.fulfilled;
            await this.token.removeOperator(futureOperator, { from: owner }).should.be.fulfilled;
          });

          it('announces a RoleAdded event on addRole', async function () {
            await expectEvent.inTransaction(
              this.token.addOperator(futureOperator, { from: owner }),
              'RoleAdded'
            );
          });

          it('announces a RoleRemoved event on removeRole', async function () {
            await expectEvent.inTransaction(
              this.token.removeOperator(minter, { from: owner }),
              'RoleRemoved'
            );
          });
        });

        describe('in adversarial conditions', function () {
          it('does not allow owner to add an empty array of operators', async function () {
            await assertRevert(
              this.token.addOperators([], { from: owner })
            );
          });

          it('does not allow "thirdParty" except owner to add operators', async function () {
            await this.token.addOperators(
              [futureOperator, anotherFutureOperator], { from: owner }
            ).should.be.fulfilled;

            await assertRevert(
              this.token.addOperator(futureOperator, { from: minter })
            );

            await assertRevert(
              this.token.addOperator(futureOperator, { from: thirdParty })
            );

            await assertRevert(
              this.token.addOperators([futureOperator, anotherFutureOperator], { from: minter })
            );

            await assertRevert(
              this.token.addOperators([futureOperator, anotherFutureOperator], { from: thirdParty })
            );
          });

          it('does not allow "thirdParty" except owner to remove an operator', async function () {
            await this.token.addOperator(futureOperator, { from: owner }).should.be.fulfilled;

            await assertRevert(
              this.token.removeOperator(futureOperator, { from: minter })
            );
            await assertRevert(
              this.token.removeOperator(futureOperator, { from: thirdParty })
            );
          });
        });
      });

      describe('if it is not an operator', function () {
        describe('trying to transfer unlocked tokens', function () {
          beforeEach(async function () {
            await this.token.mint(thirdParty, unlockedTokens, { from: minter });
          });

          it('should fail to transfer', async function () {
            await assertRevert(this.token.transfer(recipient, unlockedTokens, { from: thirdParty }));
          });

          it('should fail to transferFrom', async function () {
            await this.token.approve(anotherAccount, unlockedTokens, { from: thirdParty });
            await assertRevert(
              this.token.transferFrom(thirdParty, recipient, unlockedTokens, { from: anotherAccount })
            );
          });

          it('should fail to transferAndCall', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, unlockedTokens, { from: thirdParty })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, unlockedTokens, { from: thirdParty })
            );
          });

          it('should fail to transferFromAndCall', async function () {
            await this.token.approve(anotherAccount, unlockedTokens, { from: thirdParty });
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, thirdParty, this.receiver.address, unlockedTokens, { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, thirdParty, this.receiver.address, unlockedTokens, { from: anotherAccount }
              )
            );
          });
        });

        describe('trying to transfer locked tokens', function () {
          beforeEach(async function () {
            await this.token.mintAndLock(thirdParty, lockedTokens, { from: minter });
          });

          it('should fail to transfer', async function () {
            await assertRevert(this.token.transfer(recipient, lockedTokens, { from: thirdParty }));
          });

          it('should fail to transferFrom', async function () {
            await this.token.approve(anotherAccount, lockedTokens, { from: thirdParty });
            await assertRevert(this.token.transferFrom(thirdParty, recipient, lockedTokens, { from: anotherAccount }));
          });

          it('should fail to transferAndCall', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, lockedTokens, { from: thirdParty })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, lockedTokens, { from: thirdParty })
            );
          });

          it('should fail to transferFromAndCall', async function () {
            await this.token.approve(anotherAccount, lockedTokens, { from: thirdParty });
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, thirdParty, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, thirdParty, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );
          });
        });
      });

      describe('if it is an operator', function () {
        describe('trying to transfer unlocked tokens', function () {
          beforeEach(async function () {
            await this.token.mint(operator, unlockedTokens, { from: minter });
            await this.token.addOperator(operator, { from: owner });
          });

          it('should be token operator', async function () {
            const isOperator = await this.token.hasRole(operator, ROLE_OPERATOR);
            isOperator.should.equal(true);
          });

          it('transfers the unlocked amount', async function () {
            await this.token.transfer(recipient, unlockedTokens, { from: operator });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance);

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens);
          });

          it('transfers less than unlocked amount', async function () {
            await this.token.transfer(recipient, unlockedTokens.sub(1), { from: operator });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance.add(1));

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens.sub(1));
          });

          it('should fail to transfer if more than unlocked amount', async function () {
            await assertRevert(this.token.transfer(recipient, unlockedTokens.add(1), { from: operator }));
          });

          it('should fail to transferAndCall if more than unlocked amount', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, unlockedTokens.add(1), { from: operator })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, unlockedTokens.add(1), { from: operator })
            );
          });

          it('transferFrom the unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens, { from: operator });
            await this.token.transferFrom(operator, recipient, unlockedTokens, { from: anotherAccount });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance);

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens);
          });

          it('transferFrom less than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.sub(1), { from: operator });
            await this.token.transferFrom(operator, recipient, unlockedTokens.sub(1), { from: anotherAccount });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance.add(1));

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens.sub(1));
          });

          it('should fail to transferFrom if more than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.add(1), { from: operator });
            await assertRevert(
              this.token.transferFrom(operator, recipient, unlockedTokens.add(1), { from: anotherAccount })
            );
          });

          it('should fail to transferFromAndCall if more than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.add(1), { from: operator });
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, operator, this.receiver.address, unlockedTokens.add(1), { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, operator, this.receiver.address, unlockedTokens.add(1), { from: anotherAccount }
              )
            );
          });
        });

        describe('trying to transfer locked tokens', function () {
          beforeEach(async function () {
            await this.token.mintAndLock(operator, lockedTokens, { from: minter });
            await this.token.addOperator(operator, { from: owner });
          });

          it('should fail to transfer', async function () {
            await assertRevert(this.token.transfer(recipient, lockedTokens, { from: operator }));
          });

          it('should fail to transferFrom', async function () {
            await this.token.approve(anotherAccount, lockedTokens, { from: operator });
            await assertRevert(this.token.transferFrom(operator, recipient, lockedTokens, { from: anotherAccount }));
          });

          it('should fail to transferAndCall', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, lockedTokens, { from: operator })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, lockedTokens, { from: operator })
            );
          });

          it('should fail to transferFromAndCall', async function () {
            await this.token.approve(anotherAccount, lockedTokens, { from: operator });
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, operator, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, operator, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );
          });
        });
      });
    });

    describe('after finish minting', function () {
      beforeEach(async function () {
        await this.token.mintAndLock(operator, lockedTokens, { from: minter });
        await this.token.mint(operator, unlockedTokens, { from: minter });
        await this.token.finishMinting({ from: owner });
      });

      describe('trying to add operators', function () {
        describe('in normal conditions', function () {
          it('reverts', async function () {
            await assertRevert(
              this.token.addOperator(futureOperator, { from: owner })
            );

            await assertRevert(
              this.token.addOperators([futureOperator, anotherFutureOperator], { from: owner })
            );
          });
        });

        describe('in adversarial conditions', function () {
          it('reverts', async function () {
            await assertRevert(
              this.token.addOperators([], { from: owner })
            );

            await assertRevert(
              this.token.addOperator(futureOperator, { from: minter })
            );

            await assertRevert(
              this.token.addOperators([futureOperator, anotherFutureOperator], { from: minter })
            );

            await assertRevert(
              this.token.addOperator(futureOperator, { from: thirdParty })
            );

            await assertRevert(
              this.token.addOperators([futureOperator, anotherFutureOperator], { from: thirdParty })
            );
          });
        });
      });

      context('before unlock time', function () {
        describe('trying to transfer unlocked tokens', function () {
          beforeEach(async function () {
            (await this.token.balanceOf(operator)).should.be.bignumber.equal(lockedTokens.add(unlockedTokens));
            (await this.token.lockedBalanceOf(operator)).should.be.bignumber.equal(lockedTokens);
          });

          it('transfers the unlocked amount', async function () {
            await this.token.transfer(recipient, unlockedTokens, { from: operator });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance);

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens);
          });

          it('transfers less than unlocked amount', async function () {
            await this.token.transfer(recipient, unlockedTokens.sub(1), { from: operator });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance.add(1));

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens.sub(1));
          });

          it('should fail to transfer if more than unlocked amount', async function () {
            await assertRevert(this.token.transfer(recipient, unlockedTokens.add(1), { from: operator }));
          });

          it('should fail to transferAndCall if more than unlocked amount', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, unlockedTokens.add(1), { from: operator })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, unlockedTokens.add(1), { from: operator })
            );
          });

          it('transferFrom the unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens, { from: operator });
            await this.token.transferFrom(operator, recipient, unlockedTokens, { from: anotherAccount });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance);

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens);
          });

          it('transferFrom less than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.sub(1), { from: operator });
            await this.token.transferFrom(operator, recipient, unlockedTokens.sub(1), { from: anotherAccount });

            const senderLockedBalance = await this.token.lockedBalanceOf(operator);
            const senderBalance = await this.token.balanceOf(operator);
            senderBalance.should.be.bignumber.equal(senderLockedBalance.add(1));

            const recipientBalance = await this.token.balanceOf(recipient);
            recipientBalance.should.be.bignumber.equal(unlockedTokens.sub(1));
          });

          it('should fail to transferFrom if more than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.add(1), { from: operator });
            await assertRevert(
              this.token.transferFrom(operator, recipient, unlockedTokens.add(1), { from: anotherAccount })
            );
          });

          it('should fail to transferFromAndCall if more than unlocked amount', async function () {
            await this.token.approve(anotherAccount, unlockedTokens.add(1), { from: operator });
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, operator, this.receiver.address, unlockedTokens.add(1), { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, operator, this.receiver.address, unlockedTokens.add(1), { from: anotherAccount }
              )
            );
          });
        });

        describe('trying to transfer locked tokens', function () {
          beforeEach(async function () {
            await this.token.transfer(recipient, unlockedTokens, { from: operator });
            (await this.token.balanceOf(operator)).should.be.bignumber.equal(lockedTokens);
            (await this.token.lockedBalanceOf(operator)).should.be.bignumber.equal(lockedTokens);
          });

          it('should fail to transfer', async function () {
            await assertRevert(this.token.transfer(recipient, lockedTokens, { from: operator }));
          });

          it('should fail to transferFrom', async function () {
            await this.token.approve(anotherAccount, lockedTokens, { from: operator });
            await assertRevert(this.token.transferFrom(operator, recipient, lockedTokens, { from: anotherAccount }));
          });

          it('should fail to transferAndCall', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);

            const transferAndCallWithData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256,bytes',
                [to, value, '0x42'],
                opts
              );
            };

            const transferAndCallWithoutData = function (to, value, opts) {
              return sendTransaction(
                this.token,
                'transferAndCall',
                'address,uint256',
                [to, value],
                opts
              );
            };

            await assertRevert(
              transferAndCallWithData.call(this, this.receiver.address, lockedTokens, { from: operator })
            );

            await assertRevert(
              transferAndCallWithoutData.call(this, this.receiver.address, lockedTokens, { from: operator })
            );
          });

          it('should fail to transferFromAndCall', async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);
            await this.token.approve(anotherAccount, lockedTokens, { from: operator });

            const transferFromAndCallWithData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256,bytes',
                [from, to, value, '0x42'],
                opts
              );
            };

            const transferFromAndCallWithoutData = function (from, to, value, opts) {
              return sendTransaction(
                this.token,
                'transferFromAndCall',
                'address,address,uint256',
                [from, to, value],
                opts
              );
            };

            await assertRevert(
              transferFromAndCallWithData.call(
                this, operator, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );

            await assertRevert(
              transferFromAndCallWithoutData.call(
                this, operator, this.receiver.address, lockedTokens, { from: anotherAccount }
              )
            );
          });
        });
      });

      context('after unlock time', function () {
        const amount = lockedTokens.add(unlockedTokens);

        beforeEach(async function () {
          await increaseTimeTo(this.afterLockedUntil);
        });

        it('balance should return locked and unlocked tokens', async function () {
          (await this.token.balanceOf(operator)).should.be.bignumber.equal(amount);
        });

        it('locked balance should return zero', async function () {
          (await this.token.lockedBalanceOf(operator)).should.be.bignumber.equal(0);
        });

        it('transfers the requested amount', async function () {
          await this.token.transfer(recipient, amount, { from: operator });

          const senderBalance = await this.token.balanceOf(operator);
          senderBalance.should.be.bignumber.equal(0);

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(amount);
        });

        it('transferFrom the requested amount', async function () {
          await this.token.approve(anotherAccount, amount, { from: operator });
          await this.token.transferFrom(operator, recipient, amount, { from: anotherAccount });

          const senderBalance = await this.token.balanceOf(operator);
          senderBalance.should.be.bignumber.equal(0);

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(amount);
        });
      });
    });
  });
});
