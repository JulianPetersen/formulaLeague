import Wallet from '../models/wallet.model';
import WalletTransaction from '../models/walletTransaction.model';
import { saveLog } from './logs';

export const DEFAULT_WALLET_CURRENCY = 'USD';

export const normalizeAmount = (amount = 0) => {
  if (typeof amount === 'number') return amount;

  let normalized = String(amount)
    .trim()
    .replace(/[^\d.,-]/g, '');

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');

    normalized = lastComma > lastDot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (hasDot) {
    const parts = normalized.split('.');
    const looksLikeThousands = parts.length > 2 || parts[parts.length - 1].length === 3;

    normalized = looksLikeThousands
      ? normalized.replace(/\./g, '')
      : normalized;
  } else if (hasComma) {
    const parts = normalized.split(',');
    const looksLikeThousands = parts.length > 2 || parts[parts.length - 1].length === 3;

    normalized = looksLikeThousands
      ? normalized.replace(/,/g, '')
      : normalized.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
      currency: DEFAULT_WALLET_CURRENCY
    });
  }

  return wallet;
};

export const depositPrizeToWinner = async (prize) => {
  if (!prize || prize.status !== 'cerrado' || !prize.winner) {
    return null;
  }

  const existingTransaction = await WalletTransaction.findOne({
    type: 'prize_credit',
    prize: prize._id
  });

  if (existingTransaction) {
    return existingTransaction;
  }

  const amount = normalizeAmount(prize.amount);

  if (amount <= 0) {
    throw new Error('El premio no tiene un monto valido para depositar');
  }

  const wallet = await getOrCreateWallet(prize.winner);

  wallet.balance += amount;
  wallet.totalEarned += amount;

  await wallet.save();

  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    user: prize.winner,
    prize: prize._id,
    type: 'prize_credit',
    amount,
    currency: wallet.currency,
    description: `Premio acreditado ${prize._id}`,
    balanceAfter: wallet.balance
  });

  await saveLog({
    type: 'WALLET-PRIZE-DEPOSIT',
    message: `Deposito de premio ${prize._id} por ${amount} ${wallet.currency}`,
    user: prize.winner,
    status: 'INFO'
  });

  return transaction;
};
