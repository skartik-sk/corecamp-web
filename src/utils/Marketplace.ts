export const MARKETPLACE_ABI = [
    {
      type: "constructor",
      inputs: [
        { name: "_campfireNFT", type: "address", internalType: "address" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "buyNFT",
      inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "campfireNFT",
      inputs: [],
      outputs: [
        { name: "", type: "address", internalType: "contract IERC721" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "cancelListing",
      inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "emergencyWithdraw",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getAllActiveListings",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "tuple[]",
          internalType: "struct CoreCampMarketplace.Listing[]",
          components: [
            { name: "tokenId", type: "uint256", internalType: "uint256" },
            { name: "seller", type: "address", internalType: "address" },
            { name: "price", type: "uint256", internalType: "uint256" },
            { name: "isActive", type: "bool", internalType: "bool" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getAllListedTokenIds",
      inputs: [],
      outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getListing",
      inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
      outputs: [
        {
          name: "",
          type: "tuple",
          internalType: "struct CoreCampMarketplace.Listing",
          components: [
            { name: "tokenId", type: "uint256", internalType: "uint256" },
            { name: "seller", type: "address", internalType: "address" },
            { name: "price", type: "uint256", internalType: "uint256" },
            { name: "isActive", type: "bool", internalType: "bool" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "listNFT",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "price", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "listedTokenIds",
      inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "listings",
      inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      outputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "seller", type: "address", internalType: "address" },
        { name: "price", type: "uint256", internalType: "uint256" },
        { name: "isActive", type: "bool", internalType: "bool" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "owner",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "platformFeeBps",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "renounceOwnership",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "transferOwnership",
      inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updatePlatformFee",
      inputs: [{ name: "newFeeBps", type: "uint256", internalType: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updatePrice",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "newPrice", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "Checkpoint",
      inputs: [
        {
          name: "tokenId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "user",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "ListingCancelled",
      inputs: [
        {
          name: "tokenId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "seller",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "NFTListed",
      inputs: [
        {
          name: "tokenId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "seller",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "price",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "NFTSold",
      inputs: [
        {
          name: "tokenId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "seller",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "buyer",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "price",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "OwnershipTransferred",
      inputs: [
        {
          name: "previousOwner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "newOwner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "PriceUpdated",
      inputs: [
        {
          name: "tokenId",
          type: "uint256",
          indexed: true,
          internalType: "uint256",
        },
        {
          name: "seller",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "oldPrice",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "newPrice",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
  ]
  
