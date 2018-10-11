const { shouldBehaveLikeDefaultToken } = require('./base/DefaultToken.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');

contract('GastroAdvisorToken', function (
  [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty]
) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  beforeEach(async function () {
    this.token = await GastroAdvisorToken.new({ from: owner });
  });

  context('like a DefaultToken', function () {
    shouldBehaveLikeDefaultToken(
      [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty],
      [_name, _symbol, _decimals]
    );
  });

  context('like a GastroAdvisor token', function () {

  });
});
