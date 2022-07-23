pragma ton-solidity ^0.61.2;
pragma AbiHeader expire;

contract Wallet2 {

  /// @dev constructor
  constructor () public {
    require(tvm.pubkey() != 0, 101);
    require(msg.pubkey() == tvm.pubkey(), 102);
    tvm.accept();
  }

  // Modifier that allows function to accept external call only if it was signed
  // with contract owner's public key
  modifier checkOwnerAndAccept {
    // check that the inbound message was signed with owner's public key
    // Runtime function that obtains sender's public key
    require(msg.pubkey() == tvm.pubkey(), 100);

    // Runtime function that allows contract to process inbound message spending
    // its own resources (it's necessary if contract should process all inbound messages,
    // not only those that carry value with them).
    tvm.accept();
    _;
  }

  /// @dev Allows to transfer tons to the destination account.
  /// @param dest Transfer target address.
  /// @param value Nanotons value to transfer.
  /// @param bounce Flag that enables bounce message in case of target contract error.
  function sendTransaction(address dest, uint128 value, bool bounce) public checkOwnerAndAccept{
    dest.transfer(value, bounce, 0);
  }

}
