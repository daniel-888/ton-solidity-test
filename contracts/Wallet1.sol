pragma ever-solidity ^0.61.2;
pragma AbiHeader expire;

import './Sample.sol';

contract Wallet1 {

  // sample contract to interact
  Sample public sample;

  /// @dev constructor
  /// @param _sample the sample contract address
  constructor (address _sample) public {
    require(tvm.pubkey() != 0, 101);
    require(msg.pubkey() == tvm.pubkey(), 102);
    tvm.accept();
    sample = Sample(_sample);  
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

  function sendTransaction0(uint128 _value) public checkOwnerAndAccept{
    sample.reserve0{value: _value}();
  }

  function sendTransaction1(uint128 _value) public checkOwnerAndAccept{
    sample.reserve1{value: _value}();
  }

  function sendTransaction2(uint128 _value) public checkOwnerAndAccept{
    sample.reserve2{value: _value}();
  }

  function sendTransaction3(uint128 _value) public checkOwnerAndAccept{
    sample.reserve3{value: _value}();
  }

  function sendTransaction12(uint128 _value) public checkOwnerAndAccept{
    sample.reserve12{value: _value}();
  }

}
