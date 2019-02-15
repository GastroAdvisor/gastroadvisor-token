App = {
  hasPrivacyMode: false,
  web3Provider: null,
  contracts: {},
  instances: {},

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Initialize web3 and set the provider to the testRPC.
    if (typeof ethereum !== 'undefined') {
      console.log('injected web3');
      App.web3Provider = ethereum;
      App.hasPrivacyMode = true;
    } else if (typeof web3 !== 'undefined') {
      console.log('injected web3 (legacy)');
      App.web3Provider = web3.currentProvider;
    } else {
      // set the provider you want from Web3.providers
      console.log('provided web3');
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    if (App.hasPrivacyMode) {
      App.web3Provider.enable();
    }

    $.getJSON('GastroAdvisorToken.json', function (data) {
      App.contracts.GastroAdvisorToken = TruffleContract(data);
      App.contracts.GastroAdvisorToken.setProvider(App.web3Provider);
    });

    $.getJSON('Contributions.json', function (data) {
      App.contracts.Contributions = TruffleContract(data);
      App.contracts.Contributions.setProvider(App.web3Provider);
    });

    $.getJSON('CrowdGenerator.json', function (data) {
      App.contracts.CrowdGenerator = TruffleContract(data);
      App.contracts.CrowdGenerator.setProvider(App.web3Provider);
    });


    $.getJSON('ForkRC.json', function (data) {
      App.contracts.ForkRC = TruffleContract(data);
      App.contracts.ForkRC.setProvider(App.web3Provider);
    });

    $.getJSON('ForkPreIco.json', function (data) {
      App.contracts.ForkPreIco = TruffleContract(data);
      App.contracts.ForkPreIco.setProvider(App.web3Provider);
    });

    $.getJSON('ForkIco.json', function (data) {
      App.contracts.ForkIco = TruffleContract(data);
      App.contracts.ForkIco.setProvider(App.web3Provider);
    });

    $.getJSON('CappedBountyMinter.json', function (data) {
      App.contracts.CappedBountyMinter = TruffleContract(data);
      App.contracts.CappedBountyMinter.setProvider(App.web3Provider);
    });

    $.getJSON('CappedDelivery.json', function (data) {
      App.contracts.CappedDelivery = TruffleContract(data);
      App.contracts.CappedDelivery.setProvider(App.web3Provider);
    });

    $.getJSON('GroupForkTimelock.json', function (data) {
      App.contracts.GroupForkTimelock = TruffleContract(data);
      App.contracts.GroupForkTimelock.setProvider(App.web3Provider);
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
