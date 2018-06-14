const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function () {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  it('has a name', async function () {
    const name = await this.token.name();
    name.should.be.equal(_name);
  });

  it('has a symbol', async function () {
    const symbol = await this.token.symbol();
    symbol.should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.token.decimals();
    decimals.should.be.bignumber.equal(_decimals);
  });
}
