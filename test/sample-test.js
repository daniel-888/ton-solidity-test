const { expect } = require("chai");
const BigNumber = require("bignumber.js");

const getRandomNonce = () => (Math.random() * 64000) | 0;

describe("Test Sample contract", async function() {
  let Sample;
  let sample;
  let Wallet1;
  let wallet1;
  let Wallet2;
  let wallet2;
  let keyPair;
  let keyPair1;
  let keyPair2;
  before("Load contract factory", async function() {
    Sample = await locklift.factory.getContract("Sample");
    Wallet1 = await locklift.factory.getContract("Wallet1");
    Wallet2 = await locklift.factory.getContract("Wallet2");

    expect(Sample.code).not.to.equal(undefined, "Code should be available");
    expect(Sample.abi).not.to.equal(undefined, "ABI should be available");

    expect(Wallet1.code).not.to.equal(undefined, "Code should be available");
    expect(Wallet1.abi).not.to.equal(undefined, "ABI should be available");

    expect(Wallet2.code).not.to.equal(undefined, "Code should be available");
    expect(Wallet2.abi).not.to.equal(undefined, "ABI should be available");
  });
  describe("Contracts", async function() {
    it("Deploy contract", async function() {
      this.timeout(50000);

      [keyPair, keyPair1, keyPair2] = await locklift.keys.getKeyPairs();

      wallet2 = await locklift.giver.deployContract({
        contract: Wallet2,
        constructorParams: {},
        initParams: {},
        keyPair: keyPair2,
      });

      // console.log("wallet2 is deployed to ", wallet2.address);
      const wallet2bal = await locklift.ton.getBalance(wallet2.address);
      console.log("wallet2bal = ", wallet2bal.toString());

      sample = await locklift.giver.deployContract({
        contract: Sample,
        constructorParams: { _wallet2: wallet2.address },
        initParams: {
          _nonce: getRandomNonce(),
        },
        keyPair,
      });

      // console.log("sample is deployed to ", sample.address);
      const samplebal = await locklift.ton.getBalance(sample.address);
      console.log("samplebal = ", samplebal.toString());

      wallet1 = await locklift.giver.deployContract({
        contract: Wallet1,
        constructorParams: { _sample: sample.address },
        initParams: {},
        keyPair: keyPair1,
      });

      // console.log("wallet1 is deployed to ", wallet1.address);
      const wallet1bal = await locklift.ton.getBalance(wallet1.address);
      console.log("wallet1bal = ", wallet1bal.toString());

      expect(sample.address)
        .to.be.a("string")
        .and.satisfy((s) => s.startsWith("0:"), "Bad future address");

      expect(wallet1.address)
        .to.be.a("string")
        .and.satisfy((s) => s.startsWith("0:"), "Bad future address");

      expect(wallet2.address)
        .to.be.a("string")
        .and.satisfy((s) => s.startsWith("0:"), "Bad future address");
    });

    it("reserve0()", async function() {
      this.timeout(50000);

      const _samplebal = await locklift.ton.getBalance(sample.address); // 10 ever
      const _wallet1bal = await locklift.ton.getBalance(wallet1.address); // 10 ever
      const _wallet2bal = await locklift.ton.getBalance(wallet2.address); // 10 ever

      let value = locklift.utils.convertCrystal(1, "nano");

      await wallet1.run({
        method: "sendTransaction0",
        params: { _value: value },
        keyPair: keyPair1,
      });

      const samplebal = await locklift.ton.getBalance(sample.address); // 1 ever only reserve
      console.log("sample balance = ", samplebal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(samplebal.toString(), "ton").toNumber()
        )
      ).to.equal(1);

      const wallet1bal = await locklift.ton.getBalance(wallet1.address); // 9 ever (-msg.value)
      console.log("wallet1 balance = ", wallet1bal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(wallet1bal.toString(), "ton").toNumber()
        )
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet1bal.toString(), "ton")
            .toNumber()
        ) - 1
      );

      const wallet2bal = await locklift.ton.getBalance(wallet2.address); // 20 ever (receives 10 ever form sample contract)
      console.log("wallet2 balance = ", wallet2bal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(wallet2bal.toString(), "ton").toNumber()
        )
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet2bal.toString(), "ton")
            .toNumber()
        ) +
          Math.round(
            locklift.utils
              .convertCrystal(_samplebal.toString(), "ton")
              .toNumber()
          )
      );
    });

    it("reserve1()", async function() {
      this.timeout(50000);

      const _samplebal = await locklift.ton.getBalance(sample.address); // 1 ever
      const _wallet1bal = await locklift.ton.getBalance(wallet1.address); // 9 ever
      const _wallet2bal = await locklift.ton.getBalance(wallet2.address); // 20 ever

      let value = locklift.utils.convertCrystal(0.5, "nano");

      await wallet1.run({
        method: "sendTransaction1",
        params: { _value: value },
        keyPair: keyPair1,
      });

      const samplebal = await locklift.ton.getBalance(sample.address); // 0.3 ever
      console.log("sample balance = ", samplebal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(samplebal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_samplebal.toString(), "ton")
            .toNumber() *
            10 +
          0.5 * 10 - // msg.value
          0.2 * 10 - // hardwork fee
            1 * 10 // remains all but 1 ever
        ) / 10
      );

      const wallet1bal = await locklift.ton.getBalance(wallet1.address); // 8.5 ever
      console.log("wallet1 balance = ", wallet1bal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(wallet1bal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet1bal.toString(), "ton")
            .toNumber() *
            10 -
            0.5 * 10 // msg.value
        ) / 10
      );

      const wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21 ever
      console.log("wallet2 balance = ", wallet2bal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(wallet2bal.toString(), "ton").toNumber()
        )
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet2bal.toString(), "ton")
            .toNumber()
        ) + 1 // receives from the sample contract
      );
    });

    it("reserve2()", async function() {
      this.timeout(50000);

      const _samplebal = await locklift.ton.getBalance(sample.address); // 0.3 ever
      const _wallet1bal = await locklift.ton.getBalance(wallet1.address); // 8.5 ever
      const _wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21 ever

      let value = locklift.utils.convertCrystal(0.5, "nano");

      await wallet1.run({
        method: "sendTransaction2",
        params: { _value: value },
        keyPair: keyPair1,
      });

      const samplebal = await locklift.ton.getBalance(sample.address); // 0.6 ever = (0.3 + 0.5 - 0.2)
      console.log("sample balance = ", samplebal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(samplebal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_samplebal.toString(), "ton")
            .toNumber() *
            10 +
            0.5 * 10 -
            0.2 * 10
        ) / 10
      );

      const wallet1bal = await locklift.ton.getBalance(wallet1.address); // 8.0 ever
      console.log("wallet1 balance = ", wallet1bal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(wallet1bal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet1bal.toString(), "ton")
            .toNumber() *
            10 -
            0.5 * 10
        ) / 10
      );

      const wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21 ever
      console.log("wallet2 balance = ", wallet2bal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(wallet2bal.toString(), "ton").toNumber()
        )
      ).to.equal(
        Math.round(
          locklift.utils
            .convertCrystal(_wallet2bal.toString(), "ton")
            .toNumber()
        )
      );
    });

    it("reserve3()", async function() {
      this.timeout(50000);

      const _samplebal = await locklift.ton.getBalance(sample.address); // 0.6 ever
      const _wallet1bal = await locklift.ton.getBalance(wallet1.address); // 8.0 ever
      const _wallet2bal = await locklift.ton.getBalance(wallet2.address); // 20.8 ever

      let value = locklift.utils.convertCrystal(0.5, "nano");

      await wallet1.run({
        method: "sendTransaction3",
        params: { _value: value },
        keyPair: keyPair1,
      });

      const samplebal = await locklift.ton.getBalance(sample.address); // 0 ever = (0.6 + 0.5 - 0.2 >= 1 ? -1 : 0)
      console.log("sample balance = ", samplebal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(samplebal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(0);

      const wallet1bal = await locklift.ton.getBalance(wallet1.address); // 7.5 ever = (8.0 - 0.5)
      console.log("wallet1 balance = ", wallet1bal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(wallet1bal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(7.5);

      const wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21.7 ever = (20.8 + (0.6 + 0.5 - 0.2))
      console.log("wallet2 balance = ", wallet2bal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(wallet2bal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(21.7);
    });

    it("reserve12()", async function() {
      this.timeout(50000);

      const _samplebal = await locklift.ton.getBalance(sample.address); // 0 ever
      const _wallet1bal = await locklift.ton.getBalance(wallet1.address); // 7.5 ever
      const _wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21.7 ever

      let value = locklift.utils.convertCrystal(0.5, "nano");

      await wallet1.run({
        method: "sendTransaction12",
        params: { _value: value },
        keyPair: keyPair1,
      });

      const samplebal = await locklift.ton.getBalance(sample.address); // 0.3 ever = (0 + 0.5 - 0.2)
      console.log("sample balance = ", samplebal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(samplebal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(0.3);

      const wallet1bal = await locklift.ton.getBalance(wallet1.address); // 7.0 ever = (7.5 - 0.5)
      console.log("wallet1 balance = ", wallet1bal.toString());
      expect(
        Math.round(
          locklift.utils.convertCrystal(wallet1bal.toString(), "ton").toNumber()
        )
      ).to.equal(7.0);

      const wallet2bal = await locklift.ton.getBalance(wallet2.address); // 21.7 ever not changed
      console.log("wallet2 balance = ", wallet2bal.toString());
      console.log("wallet2 balance = ", wallet2bal.toString());
      expect(
        Math.round(
          locklift.utils
            .convertCrystal(wallet2bal.toString(), "ton")
            .toNumber() * 10
        ) / 10
      ).to.equal(21.7);
    });
  });
});
