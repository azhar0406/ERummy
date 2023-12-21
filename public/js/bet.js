// Define the contract address and contract ABI
const CONTRACT_ADDRESS = "0x52A2f8b64E4ca54C38F511431209bCf9d16Fff61";
const contractInfo = [
    {
        "inputs": [],
        "name": "placeBet",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "payable",
        "type": "function"
    }
];

// Connect to MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
let contract;

async function login() {
    try {
        // Request account access if needed
        await provider.send("eth_requestAccounts", []);
        
        // Get the signer
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        console.log(address);

        // Create a contract instance
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractInfo, signer);
    } catch (error) {
        console.error(error);
    }
}

login();

// Function to place a bet
let newGame = () => { 
    const betAmount = document.querySelector('#code').value;

    // Ensure the contract is initialized
    if (!contract) {
        console.error("Contract not initialized");
        return;
    }

    // Call the placeBet function
    contract.placeBet({ value: ethers.utils.parseEther(betAmount), gasLimit: ethers.utils.hexlify(2500000) })
        .then((transaction) => {
            console.log('Transaction sent:', transaction.hash);
            return transaction.wait();
        })
        .then((receipt) => {
            console.log('Transaction confirmed:', receipt.transactionHash);
            // Redirect to newgame.html
            window.location.href = '/newgame.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error placing bet');
        });
};
