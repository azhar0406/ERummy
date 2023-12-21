const express = require('express')
const http = require('http');
const WebSocket = require('ws');
const Game = require('./game');
require('dotenv').config();
const contractInfo = require("./abi.json");
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rummy = new Game(wss);


const { ethers, Wallet, JsonRpcProvider, Contract  } = require("ethers");
const { createInstance, FhevmInstance } = require('fhevmjs');



const CONTRACT_ADDRESS = "0x52A2f8b64E4ca54C38F511431209bCf9d16Fff61";

const provider = new ethers.providers.JsonRpcProvider();

const signer = new Wallet(process.env.PRIVATE_KEY, provider);

const contract = new Contract(CONTRACT_ADDRESS, contractInfo, signer);

let _instance;


const getInstance = async () => {
  if (_instance) return _instance;

  // 1. Get chain id
  const network = await provider.getNetwork();

  const chainId = +network.chainId.toString();

  // Get blockchain public key
  const publicKey = await provider.call({
    to: "0x0000000000000000000000000000000000000044"
  });

  // console.log(chainId);
  // console.log(publicKey);
  _instance = createInstance({ chainId, publicKey });
  // console.log(await _instance);
  return _instance;
}; 

const getBalance = async () => {
  // Initialize contract with ethers
  // const contract = new Contract(CONTRACT_ADDRESS, contractInfo, signer);

  // Get instance to encrypt amount parameter
  const instance = await getInstance();

  // Generate token to decrypt

  let txPublicKey = await instance.getTokenSignature(CONTRACT_ADDRESS)?.publicKey;
  let signature;
  let generatedToken;

        // if (!txPublicKey) {
        // txPublicKey = await instance.generateToken({verifyingContract: CONTRACT_ADDRESS}).publicKey;

            generatedToken = await instance.generateToken({
              verifyingContract: CONTRACT_ADDRESS,
            });
    
            // console.log(generatedToken);
      // Sign the public key
      signature = await signer._signTypedData(
        generatedToken.token.domain,
        { Reencrypt: generatedToken.token.types.Reencrypt }, // Need to remove EIP712Domain from types
        generatedToken.token.message,
      );
 
      instance.setTokenSignature(CONTRACT_ADDRESS, signature);



  return true;
};

async function shuffleDeck(contract) {
  try {
      const shuffleTx = await contract.shuffle();
      await shuffleTx.wait(); // Wait for the transaction to be mined
      console.log('Deck shuffled successfully');
  } catch (error) {
      console.error('Error shuffling deck:', error);
  }
}

async function getSolidityDeck() {

  try {
      let solidityDeckOutput = await contract.getDeck();
      return solidityDeckOutput;
  } catch (error) {
      console.error('Error fetching deck from contract:', error);
  }
}


// Serve Static Files/Assets
app.use(express.static('public'));

// Ignore Socket Errors
wss.on('error', () => console.log('*errored*'));
wss.on('close', () => console.log('*disconnected*'));

/*----------------------ENDPOINTS----------------------*/
app.get('/', (req, res) => {
  // init();
  res.sendFile(__dirname + '/public/newgame.html');
});

app.get('/join/:lobby', async (req, res) => {
  let code = req.params.lobby;
  // await shuffleDeck(contract); 
  const solidityDeck = await getSolidityDeck();
  // console.log(solidityDeck);
  if (rummy.addLobby(code,cpu=false,solidityDeck)) {
    res.redirect('/game/' + req.params.lobby + '/' + rummy.lobbys[code].token);
  } else {
    res.redirect('/newgame/');
  }
});

app.get('/joincpu/:lobby', async (req, res) => {
  let code = req.params.lobby;
  // await shuffleDeck(contract); 
  const solidityDeck = await getSolidityDeck();
  // console.log(solidityDeck);
  if (rummy.addLobby(code, cpu=true,solidityDeck)) {
    res.redirect('/game/' + req.params.lobby + '/' + rummy.lobbys[code].token);
  } else {
    res.redirect('/newgame/');
  }
});

app.get('/game/:lobby/:token', (req, res) => {
  let code = "" + req.params.lobby,
      token = req.params.token;
  if (req.params.token && rummy.lobbys[code] && rummy.lobbys[code].token == token) {
    res.sendFile(__dirname + '/public/game.html');
  } else {
    res.redirect('/newgame/');
  }
});

app.use(function (req, res, next) {
  res.redirect('/'); // Redirect to the home page
});

// Start Server
server.listen(3000, () => {
  console.log('Listening on port 3000...')
});
