const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const { shouldBehaveLikeERC1363BasicToken } = require('erc-payable-token/test/token/ERC1363/ERC1363BasicToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeMintableToken } = require('openzeppelin-solidity/test/token/ERC20/MintableToken.behaviour');
const { shouldBehaveLikeRBACMintableToken } = require('openzeppelin-solidity/test/token/ERC20/RBACMintableToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeBurnableToken } = require('openzeppelin-solidity/test/token/ERC20/BurnableToken.behaviour');
const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const { shouldBehaveLikeDetailedERC20Token } = require('../ERC20/DetailedERC20.behaviour');
const { shouldBehaveLikeStandardToken } = require('../ERC20/StandardToken.behaviour');
const { shouldBehaveLikeRBAC } = require('../../access/RBAC.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC1363Receiver = artifacts.require('ERC1363ReceiverMock.sol');

function shouldBehaveLikeBaseToken (
  [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty],
  [_name, _symbol, _decimals]
) {
  context('like a DetailedERC20 token', function () {
    shouldBehaveLikeDetailedERC20Token(_name, _symbol, _decimals);
  });

  context('like a MintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
  });

  context('like a RBACMintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  });

  context('like a BurnableToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });
    shouldBehaveLikeBurnableToken([owner], initialBalance);
  });

  context('like a StandardToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeStandardToken([owner, anotherAccount, recipient], initialBalance);
  });

  context('like a ERC1363BasicToken ', function () {
    const RECEIVER_MAGIC_VALUE = '0x88a7ca5c';
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });

      this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, false);
      this.to = this.receiver.address;
    });

    describe('before finishMinting', function () {
      describe('via transferFromAndCall', function () {
        beforeEach(async function () {
          await this.token.approve(anotherAccount, initialBalance, { from: owner });
        });

        it('reverts', async function () {
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
            transferFromAndCallWithData.call(this, owner, this.to, initialBalance, { from: anotherAccount })
          );

          await assertRevert(
            transferFromAndCallWithoutData.call(this, owner, this.to, initialBalance, { from: anotherAccount })
          );
        });
      });

      describe('via transferAndCall', function () {
        it('reverts', async function () {
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
            transferAndCallWithData.call(this, this.to, initialBalance, { from: owner })
          );

          await assertRevert(
            transferAndCallWithoutData.call(this, this.to, initialBalance, { from: owner })
          );
        });
      });
    });

    describe('after finishMinting', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: owner });
      });

      shouldBehaveLikeERC1363BasicToken([owner, anotherAccount, recipient], initialBalance);
    });
  });

  context('like a RBAC', function () {
    beforeEach(async function () {
      this.instance = this.token;
    });

    shouldBehaveLikeRBAC([owner, minter, futureMinter, anotherFutureMinter, thirdParty]);
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.token;
    });

    shouldBehaveLikeTokenRecover([owner, thirdParty]);
  });
}

module.exports = {
  shouldBehaveLikeBaseToken,
};
