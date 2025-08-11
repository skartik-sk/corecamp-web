// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockVRFCoordinatorV2
 * @dev Mock VRF Coordinator for testing lottery functionality
 */
contract MockVRFCoordinatorV2 {
    
    struct RandomWordsRequest {
        address requester;
        uint256 requestId;
        bytes32 keyHash;
        uint64 subId;
        uint16 minimumRequestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
    }
    
    uint256 private _requestIdCounter = 1;
    mapping(uint256 => RandomWordsRequest) public requests;
    
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);
    
    /**
     * @dev Request random words (mock implementation)
     */
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = _requestIdCounter++;
        
        requests[requestId] = RandomWordsRequest({
            requester: msg.sender,
            requestId: requestId,
            keyHash: keyHash,
            subId: subId,
            minimumRequestConfirmations: minimumRequestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords
        });
        
        emit RandomWordsRequested(
            keyHash,
            requestId,
            uint256(keccak256(abi.encode(block.timestamp, block.prevrandao))),
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        
        return requestId;
    }
    
    /**
     * @dev Fulfill random words request (for testing)
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) public {
        RandomWordsRequest memory request = requests[requestId];
        require(request.requester != address(0), "Request does not exist");
        
        // Call the callback on the requesting contract
        (bool success,) = request.requester.call(
            abi.encodeWithSelector(
                bytes4(keccak256("fulfillRandomWords(uint256,uint256[])")),
                requestId,
                randomWords
            )
        );
        
        emit RandomWordsFulfilled(requestId, randomWords[0], 0, success);
    }
    
    /**
     * @dev Auto-fulfill with a specific random number (for deterministic testing)
     */
    function fulfillRandomWordsWithNumber(uint256 requestId, uint256 randomNumber) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomNumber;
        fulfillRandomWords(requestId, randomWords);
    }
    
    /**
     * @dev Get request details
     */
    function getRequest(uint256 requestId) external view returns (RandomWordsRequest memory) {
        return requests[requestId];
    }
}
