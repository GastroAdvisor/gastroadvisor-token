# FORK token by GastroAdvisor

[![Build Status](https://travis-ci.org/GastroAdvisor/gastroadvisor-token.svg?branch=master)](https://travis-ci.org/GastroAdvisor/gastroadvisor-token)
[![Coverage Status](https://coveralls.io/repos/github/GastroAdvisor/gastroadvisor-token/badge.svg?branch=master)](https://coveralls.io/github/GastroAdvisor/gastroadvisor-token?branch=master)

Smart Contracts for the FORK token issued by [GastroAdvisor](https://www.gastroadvisor.com)

## Installation

Install truffle.

```bash
npm install -g truffle      // Version 4.1.14+ required.
```

## Install dependencies

```bash
npm install
```

## Linter

Use Solium

```bash
npm run lint:sol
```

Use ESLint

```bash
npm run lint:js
```

Use both and fix

```bash
npm run lint:fix
```

## Compile and test the contracts.

Open the Truffle console

```bash
truffle develop
```

Compile 

```bash
compile 
```

Test

```bash
test
```

## Optional

Install the [truffle-flattener](https://github.com/alcuadrado/truffle-flattener)

```bash
npm install -g truffle-flattener
```

Usage 

```bash
truffle-flattener contracts/token/GastroAdvisorToken.sol >> dist/GastroAdvisorToken.dist.sol
```

#### Notes

IMPORTANT: Before commit run the lint and fix command:

```bash
npm run lint:all:fix
```
