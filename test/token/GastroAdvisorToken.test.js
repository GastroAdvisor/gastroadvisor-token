const { assertRevert } = require('../helpers/assertRevert');
const { sendTransaction } = require('../helpers/sendTransaction');

const { shouldBehaveLikeDetailedERC20Token } = require('./ERC20/DetailedERC20.behaviour');
const { shouldBehaveLikeMintableToken } = require('./ERC20/MintableToken.behaviour');
const { shouldBehaveLikeRBACMintableToken } = require('./ERC20/RBACMintableToken.behaviour');
const { shouldBehaveLikeBurnableToken } = require('./ERC20/BurnableToken.behaviour');
const { shouldBehaveLikeStandardToken } = require('./ERC20/StandardToken.behaviour');
const { shouldBehaveLikeERC1363BasicToken } = require('./ERC1363/ERC1363BasicToken.behaviour');
const { shouldBehaveLikeTokenRecover } = require('../safe/TokenRecover.behaviour');
const { shouldBehaveLikeRBAC } = require('../access/RBAC.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const ERC1363Receiver = artifacts.require('ERC1363ReceiverMock.sol');

contract('GastroAdvisorToken', function (
  [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty]
) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  beforeEach(async function () {
    this.token = await GastroAdvisorToken.new({ from: owner });
  });

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
            transferAndCallWithData.call(this, this.to, initialBalance, { from: anotherAccount })
          );

          await assertRevert(
            transferAndCallWithoutData.call(this, this.to, initialBalance, { from: anotherAccount })
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

  context('like a GastroAdvisor token', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });

    it('should fail transfer before finish minting', async function () {
      await assertRevert(this.token.transfer(owner, initialBalance, { from: owner }));
    });

    it('should fail transferFrom before finish minting', async function () {
      await this.token.approve(anotherAccount, initialBalance, { from: owner });
      await assertRevert(this.token.transferFrom(owner, recipient, initialBalance, { from: anotherAccount }));
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
});
