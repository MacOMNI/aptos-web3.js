import { WalletClient } from "./wallet_client";
import { NODE_URL, FAUCET_URL } from "./util.test";

const apis = new WalletClient(NODE_URL, FAUCET_URL);

test("verify airdrop", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );
  await apis.airdrop(aliceAccount.address().toString(), 1234);
  expect(await apis.getBalance(aliceAccount.address())).toBe(1234);
});

test("verify transfer", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );

  await apis.airdrop(aliceAccount.address().toString(), 20000);
  const bob = await apis.createWallet();

  const bobAccount = await WalletClient.getAccountFromMetaData(
    bob.code,
    bob.accounts[0]
  );
  await apis.transfer(aliceAccount, bobAccount.address(), 15000);
  expect(await apis.getBalance(bobAccount.address())).toBe(15000);
});

test("verify signMessage", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );
  await WalletClient.signMessage(aliceAccount, "This is a test message");
});

test("verify creating collection and NFT", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );

  await apis.airdrop(aliceAccount.address().toString(), 20000);

  const collectionName = "AliceCollection";
  const tokenName = "Alice Token";

  // Create collection and token on Alice's account
  await apis.createCollection(
    aliceAccount,
    collectionName,
    "Alice's simple collection",
    "https://aptos.dev"
  );

  await apis.createToken(
    aliceAccount,
    collectionName,
    tokenName,
    "Alice's simple token",
    1,
    "https://aptos.dev/img/nyan.jpeg"
  );

  const tokens = await apis.getTokens(aliceAccount.address().toString());
  expect(tokens[0].name).toBe(tokenName);
});

test("verify transferring NFT", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );

  const bob = await apis.createWallet();
  const bobAccount = await WalletClient.getAccountFromMetaData(
    bob.code,
    bob.accounts[0]
  );

  await apis.airdrop(aliceAccount.address().toString(), 20000);
  await apis.airdrop(bobAccount.address().toString(), 20000);

  const collectionName = "AliceCollection";
  const tokenName = "Alice Token";

  // Create collection and token on Alice's account
  await apis.createCollection(
    aliceAccount,
    collectionName,
    "Alice's simple collection",
    "https://aptos.dev"
  );

  await apis.createToken(
    aliceAccount,
    collectionName,
    tokenName,
    "Alice's simple token",
    1,
    "https://aptos.dev/img/nyan.jpeg"
  );

  await apis.offerToken(
    aliceAccount,
    bobAccount.address().toString(),
    aliceAccount.address().toString(),
    collectionName,
    tokenName,
    1
  );
  await apis.claimToken(
    bobAccount,
    aliceAccount.address().toString(),
    aliceAccount.address().toString(),
    collectionName,
    tokenName
  );

  const aliceTokens = await apis.getTokens(aliceAccount.address().toString());
  expect(aliceTokens.length).toBe(0);
  const bobTokens = await apis.getTokens(bobAccount.address().toString());
  expect(bobTokens[0].name).toBe(tokenName);
});

test("verify signAndSubmitTransactions", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );
  await apis.airdrop(aliceAccount.address().toString(), 20000);

const collectionName = "AptosCollection";
const tokenName = "AptosToken";

const txn1 = await apis.aptosClient.generateTransaction(
  aliceAccount.address().toString(),
  {
    type: "script_function_payload",
    function: "0x1::token::create_unlimited_collection_script",
    type_arguments: [],
    arguments: [
      Buffer.from(collectionName).toString("hex"),
      Buffer.from("description").toString("hex"),
      Buffer.from("https://www.aptos.dev").toString("hex"),
    ],
  }
);
const txn2 = await apis.aptosClient.generateTransaction(
  aliceAccount.address().toString(),
  {
    type: "script_function_payload",
    function: "0x1::token::create_unlimited_token_script",
    type_arguments: [],
    arguments: [
      Buffer.from(collectionName).toString("hex"),
      Buffer.from(tokenName).toString("hex"),
      Buffer.from("description").toString("hex"),
      true,
      "1",
      Buffer.from("https://aptos.dev/img/nyan.jpeg").toString("hex"),
      "0",
    ],
  }
);
  await apis.signAndSubmitTransactions(aliceAccount, [txn1, txn2]);

  const tokens = await apis.getTokens(aliceAccount.address().toString());
  expect(tokens[0].name).toBe(tokenName);
});

test("verify estimate gas fees", async () => {
  const alice = await apis.createWallet();
  const aliceAccount = await WalletClient.getAccountFromMetaData(
    alice.code,
    alice.accounts[0]
  );
  const bob = await apis.createWallet();
  const bobAccount = await WalletClient.getAccountFromMetaData(
    bob.code,
    bob.accounts[0]
  );
  await apis.airdrop(aliceAccount.address().toString(), 5000);
const txn = await apis.aptosClient.generateTransaction(
  aliceAccount.address().toString(),
  {
    type: "script_function_payload",
    function: "0x1::coin::transfer",
    type_arguments: ["0x1::test_coin::TestCoin"],
    arguments: [bobAccount.address().toString(), "500"],
  }
);
  const estimatedGas = await apis.estimateGasFees(aliceAccount, txn);
  const txnHash = await apis.signAndSubmitTransaction(aliceAccount, txn);
  const txnData: any = await apis.aptosClient.getTransaction(txnHash);
  expect(estimatedGas).toBe(txnData.gas_used);
});

test(
  "verify estimate cost",
  async () => {
    const alice = await apis.createWallet();
    const aliceAccount = await WalletClient.getAccountFromMetaData(
      alice.code,
      alice.accounts[0]
    );
    await apis.airdrop(aliceAccount.address().toString(), 10000);
    const collectionName = "AptosCollection";
    const tokenName = "AptosToken";

    const txn1 = await apis.aptosClient.generateTransaction(
      aliceAccount.address().toString(),
      {
        type: "script_function_payload",
        function: "0x1::token::create_unlimited_collection_script",
        type_arguments: [],
        arguments: [
          Buffer.from(collectionName).toString("hex"),
          Buffer.from("description").toString("hex"),
          Buffer.from("https://www.aptos.dev").toString("hex"),
        ],
      }
    );
    await apis.signAndSubmitTransactions(aliceAccount, [txn1]);

    const txn2 = await apis.aptosClient.generateTransaction(
      aliceAccount.address().toString(),
      {
        type: "script_function_payload",
        function: "0x1::token::create_unlimited_token_script",
        type_arguments: [],
        arguments: [
          Buffer.from(collectionName).toString("hex"),
          Buffer.from(tokenName).toString("hex"),
          Buffer.from("description").toString("hex"),
          true,
          "1",
          Buffer.from("https://aptos.dev/img/nyan.jpeg").toString("hex"),
          "0",
        ],
      }
    );

    const estimatedCost = await apis.estimateCost(aliceAccount, txn2);
    const currentBalance = await apis.getBalance(aliceAccount.address());
    const txnHash = await apis.signAndSubmitTransaction(aliceAccount, txn2);
    const txnData: any = await apis.aptosClient.getTransaction(txnHash);
    const updatedBalance = await apis.getBalance(aliceAccount.address());
    expect(estimatedCost).toBe(
      (currentBalance - updatedBalance - txnData.gas_used).toString()
    );
  },
  60 * 1000
);

// test("verify fungible tokens", async () => {
//     const alice = await apis.createWallet();
//     var aliceAccount = await apis.getAccountFromMetaData(alice.code, alice.accounts[0]);
//     await apis.airdrop(aliceAccount.address().toString(), 20000);

//     const bob = await apis.createWallet();
//     var bobAccount = await apis.getAccountFromMetaData(bob.code, bob.accounts[0]);
//     await apis.airdrop(bobAccount.address().toString(), 20000);
//     // the address will change with time
//     const coin_type_path = `${aliceAccount.address().toString()}::MartianCoin::MartianCoin`;

//     await apis.initializeCoin(aliceAccount, coin_type_path, "Martian Coin", "MAR", 6);
//     await apis.registerCoin(aliceAccount, coin_type_path);
//     await apis.mintCoin(aliceAccount, coin_type_path, aliceAccount.address().toString(), 3000);
//     await apis.getCoinBalance(aliceAccount.address().toString(), coin_type_path);

//     await apis.registerCoin(bobAccount, coin_type_path);
//     await apis.transferCoin(aliceAccount, coin_type_path, bobAccount.address().toString(), 1000);

//     expect(await apis.getCoinBalance(bobAccount.address().toString(), coin_type_path)).toBe(1000);
// })

// test("should be able to create a new wallet and rotate auth keys", async () => {
//     // var alice = await apis.createWallet();
//     // console.log(alice);

//     // var aliceAccount = await apis.getAccountFromMetaData(alice.code, alice.accounts[0]);

//     // await apis.rotateAuthKey(alice.code, alice.accounts[0]);
//     const tmp = "fresh left easily alpha round wood someone unfair draft fly vital observe"
//     const alice = await apis.importWallet(tmp);
//     await apis.airdrop(alice[0].address().toString(), 20000);
//     // await apis.createNewAccount(alice.code);
//     // alice = await apis.importWallet(alice.code);

//     // await apis.createNewAccount(alice.code);
//     // alice = await apis.importWallet(alice.code);

//     // await apis.createNewAccount(alice.code);
//     // alice = await apis.importWallet(alice.code);

//     // aliceAccount = await apis.getAccountFromMetaData(alice.code, alice.accounts[2]);
//     // await apis.airdrop(aliceAccount.address().toString(), 20000);

//     // console.log(await apis.rotateAuthKey(alice.code, alice.accounts[2]));
//     // alice = await apis.importWallet(alice.code);

//     // aliceAccount = await apis.getAccountFromMetaData(alice.code, alice.accounts[2]);
//     // await apis.rotateAuthKey(alice.code, alice.accounts[2]);
//     // alice = await apis.importWallet(alice.code);

//     // aliceAccount = await apis.getAccountFromMetaData(alice.code, alice.accounts[2]);
//     // await apis.transfer(aliceAccount, alice.accounts[3].address, 100);
//     // console.log(await apis.getBalance(aliceAccount.address().toString()));

//     // console.log(await apis.getBalance(alice.accounts[3].address));
// },300000);
