import { Address, PublicClient, WalletClient } from 'viem';

import { LOTTERY_ABI } from './lottery-abi';

// TODO: Replace with your deployed contract address
export const LOTTERY_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Type for the returned lottery struct
export interface LotteryStruct {
  creator: string;
  title: string;
  description: string;
  ticketPrice: bigint;
  totalTickets: bigint;
  soldTickets: bigint;
  endTime: bigint;
  winner: string;
  isActive: boolean;
  winnerAnnounced: boolean;
}

export async function getLotteries(client: PublicClient) {
  // Fetch all lotteries (assume nextLotteryId is public)
  const nextId = await client.readContract({
    address: LOTTERY_CONTRACT_ADDRESS,
  abi: LOTTERY_ABI,
    functionName: 'nextLotteryId',
  }) as bigint;

  const lotteries = await Promise.all(
    Array.from({ length: Number(nextId) }, async (_, i) => {
      const data = await client.readContract({
        address: LOTTERY_CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'lotteries',
        args: [BigInt(i)],
      }) as LotteryStruct;
      return { id: i, ...(data as object) };
    })
  );
  return lotteries;
}

export async function buyTickets(client: WalletClient, lotteryId: number, quantity: number, ticketPrice: bigint) {
  return client.writeContract({
    address: LOTTERY_CONTRACT_ADDRESS,
  abi: LOTTERY_ABI,
    functionName: 'buyTickets',
    args: [BigInt(lotteryId), BigInt(quantity)],
    value: ticketPrice * BigInt(quantity),
  });
}

export async function announceWinner(client: WalletClient, lotteryId: number) {
  return client.writeContract({
    address: LOTTERY_CONTRACT_ADDRESS,
  abi: LOTTERY_ABI,
    functionName: 'announceWinner',
    args: [BigInt(lotteryId)],
  });
}
