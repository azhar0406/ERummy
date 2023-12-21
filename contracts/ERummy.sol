// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity >=0.8.13 <0.9.0;

import "fhevm/abstracts/EIP712WithModifier.sol";
import "fhevm/lib/TFHE.sol";

contract CardDealer is EIP712WithModifier {
    struct Card {
        uint8 suit;
        uint8 rank;
    }

      struct CardE {
        euint8 suit;
        euint8 rank;
    }

   Card[52] private deck;
  CardE[52] private deckE;

     address private admin;

    // Enums for suits and ranks
    enum Suit { Spade, Heart, Diamond, Club }
    enum Rank { Ace, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King }


    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function.");
        _;
    }

    constructor() EIP712WithModifier("Authorization token", "1") {
    admin = msg.sender;
    }

    


    function getDeck()
    public
    view
    onlyAdmin
    returns (Card[52] memory)
{
    return deck;
}

function getDeckE(
    bytes32 publicKey,
    bytes calldata signature
)
    public
    view
    onlySignedPublicKey(publicKey, signature)
    returns (bytes memory)
{
    bytes[] memory localdecksuit; // Assuming initialization
    bytes[] memory localdeckrank; // Assuming initialization

    // Temporary bytes array to store concatenated results
    bytes memory mergedBytes;

    for(uint8 i = 0; i < 52; i++){
        localdecksuit[i] = TFHE.reencrypt(deckE[i].suit, publicKey);
        localdeckrank[i] = TFHE.reencrypt(deckE[i].rank, publicKey);

        // Concatenate each suit and rank pair
        mergedBytes = abi.encodePacked(mergedBytes, localdecksuit[i], localdeckrank[i]);
    }

    return mergedBytes;
}


function shuffle() public{

_genAndShuffleDeck();

}

function getRandomNumber(uint8 range) internal view returns (uint8) {
    // Generate a random encrypted uint8 value
   uint8 decryptedRandom = uint8(uint256(blockhash(block.number-1)) % range);
    // Calculate the remainder and adjust it to fit within the range
    uint8 moduloResult = decryptedRandom % range;
    return moduloResult;
}

    // Function to generate and shuffle the deck
    function _genAndShuffleDeck() internal 
    {
        uint8 index = 0;
        for (uint8 suit = 0; suit < 4; suit++) 
        {
            for (uint8 rank = 0; rank < 13; rank++) 
            {
                deck[index] = Card(suit, rank);
                index++;
            }
        }

        // Shuffle the deck using on-chain randomness
        for (uint8 i = 52 - 1; i > 0; i--) 
        {
            uint8 j = getRandomNumber(i + 1);
            Card memory temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

    }

    // Helper function to generate a random number within a range
function getRandomNumberE(uint8 range) internal view returns (uint8) {
    // Generate a random encrypted uint8 value
   euint8 encryptedRandom = TFHE.asEuint8(uint256(blockhash(block.number-1)) % range);

    // Decrypt the encrypted random value
   uint8 decryptedRandom = TFHE.decrypt(encryptedRandom);

   //uint8 decryptedRandom = 120;

    // Calculate the remainder and adjust it to fit within the range
    uint8 moduloResult = decryptedRandom % range;
    return moduloResult;
}
    // Function to generate and shuffle the deck
function _genAndShuffleDeckE() internal {
    uint8 index = 0;
    for (uint8 suit = 0; suit < 4; suit++) {
        for (uint8 rank = 0; rank < 13; rank++) {
            deckE[index] = CardE(TFHE.asEuint8(suit), TFHE.asEuint8(rank));
            index++;
        }
    }

    // Shuffle the deck using on-chain randomness
  for (uint8 i = 52 - 1; i > 0; i--) {
    uint8 j = getRandomNumber(i + 1);

    // Use a temporary variable to store one of the cards
    Card memory temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
}
}

    function placeBet() external payable returns(bool){
        require(msg.value >0,"Payment is must for the game");
        _genAndShuffleDeck();
        return true;
    }

    function withdraw(address payable _user, uint256 _amount) external onlyAdmin returns(bool){

          // Check for sufficient contract balance
        require(address(this).balance >= _amount, "Insufficient funds in contract");

        // Interactions: Transfer the amount
        (bool sent, ) = _user.call{value: _amount}("");
        require(sent, "Failed to send Ether");

        return sent;
    }

    receive() external payable {}



}