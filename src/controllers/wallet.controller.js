import Wallet from '../models/wallet.model';
import WalletClaim from '../models/walletClaim.model';
import WalletTransaction from '../models/walletTransaction.model';
import Prize from '../models/prize.model';
import { saveLog } from '../utils/logs';
import { DEFAULT_WALLET_CURRENCY, getOrCreateWallet } from '../utils/wallet';

const ACTIVE_CLAIM_STATUSES = ['pending', 'approved'];

const getSeason = (prize) => {
  if (prize?.endDate) {
    return String(new Date(prize.endDate).getFullYear());
  }

  return String(new Date().getFullYear());
};

const findDisplayPrize = async (userId) => {
  const wonPrizeWithBalance = await Prize.findOne({
    winner: userId,
    status: 'cerrado'
  }).sort({ updatedAt: -1 });

  if (wonPrizeWithBalance) return wonPrizeWithBalance;

  const activePrize = await Prize.findOne({ status: 'activo' })
    .sort({ createdAt: -1 });

  if (activePrize) return activePrize;

  return Prize.findOne({ status: { $in: ['cerrado', 'proximamente'] } })
    .sort({ createdAt: -1 });
};

const mapClaim = (claim) => {
  if (!claim) return undefined;

  return {
    _id: claim._id,
    status: claim.status,
    method: claim.method,
    accountAlias: claim.accountAlias,
    note: claim.note,
    amount: claim.amount,
    currency: claim.currency,
    requestedAt: claim.requestedAt,
    approvedAt: claim.approvedAt,
    paidAt: claim.paidAt,
    rejectedReason: claim.rejectedReason
  };
};

const buildWalletSummary = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  const prize = await findDisplayPrize(userId);
  const claim = await WalletClaim.findOne({ user: userId })
    .sort({ createdAt: -1 });

  const isWinner = Boolean(prize?.winner) && String(prize.winner) === String(userId);
  const prizeStatus = prize?.status || 'not_available';
  const hasActiveClaim = claim && ACTIVE_CLAIM_STATUSES.includes(claim.status);
  const canClaim = wallet.balance > 0 && !hasActiveClaim;

  return {
    season: getSeason(prize),
    currency: wallet.currency || DEFAULT_WALLET_CURRENCY,
    accumulatedPrize: wallet.totalEarned,
    availableBalance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    totalPaid: wallet.totalPaid,
    prizeStatus,
    isWinner,
    canClaim,
    claim: mapClaim(claim),
    updatedAt: claim?.updatedAt || wallet.updatedAt || prize?.updatedAt || new Date()
  };
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await buildWalletSummary(req.user.id);

    return res.status(200).json(wallet);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const requestClaim = async (req, res) => {
  try {
    const { method, accountAlias, note } = req.body;

    if (!method || !accountAlias) {
      return res.status(400).json({
        message: 'Metodo de pago y cuenta son obligatorios'
      });
    }

    const wallet = await getOrCreateWallet(req.user.id);

    if (wallet.balance <= 0) {
      return res.status(400).json({
        message: 'No tenes saldo disponible para reclamar'
      });
    }

    const activeClaim = await WalletClaim.findOne({
      user: req.user.id,
      status: { $in: ACTIVE_CLAIM_STATUSES }
    });

    if (activeClaim) {
      return res.status(400).json({
        message: 'Ya tenes una solicitud de cobro en revision'
      });
    }

    const amount = wallet.balance;
    const latestWonPrize = await Prize.findOne({
      winner: req.user.id,
      status: 'cerrado'
    }).sort({ updatedAt: -1 });

    const claim = await WalletClaim.create({
      user: req.user.id,
      wallet: wallet._id,
      prize: latestWonPrize?._id,
      amount,
      currency: wallet.currency,
      method,
      accountAlias,
      note
    });

    wallet.balance -= amount;
    wallet.pendingBalance += amount;

    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      user: req.user.id,
      prize: latestWonPrize?._id,
      claim: claim._id,
      type: 'claim_hold',
      amount,
      currency: wallet.currency,
      description: `Saldo reservado para solicitud de cobro ${claim._id}`,
      balanceAfter: wallet.balance
    });

    await saveLog({
      type: 'WALLET-CLAIM-REQUEST',
      message: `Solicitud de cobro creada por ${amount} ${wallet.currency}`,
      user: req.user.id,
      status: 'INFO'
    });

    const updatedWallet = await buildWalletSummary(req.user.id);

    return res.status(201).json(updatedWallet);
  } catch (error) {
    console.error(error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
};

export const getClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const claims = await WalletClaim.find(query)
      .populate('user', 'username email points')
      .populate('wallet')
      .populate('prize')
      .sort({ createdAt: -1 });

    return res.status(200).json(claims);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;

    const allowedStatuses = ['pending', 'approved', 'paid', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Estado de solicitud invalido'
      });
    }

    const claim = await WalletClaim.findById(id);

    if (!claim) {
      return res.status(404).json({
        message: 'Solicitud de cobro no encontrada'
      });
    }

    const wallet = await Wallet.findById(claim.wallet);

    if (!wallet) {
      return res.status(404).json({
        message: 'Billetera no encontrada'
      });
    }

    if (claim.status === 'paid') {
      return res.status(400).json({
        message: 'La solicitud ya fue pagada'
      });
    }

    if (claim.status === 'rejected') {
      return res.status(400).json({
        message: 'Una solicitud rechazada no puede reabrirse. El usuario debe crear una nueva solicitud'
      });
    }

    if (status === 'rejected' && ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - claim.amount);
      wallet.balance += claim.amount;
      claim.rejectedReason = rejectedReason || 'Solicitud rechazada';
      claim.approvedAt = undefined;
      claim.paidAt = undefined;

      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        user: claim.user,
        prize: claim.prize,
        claim: claim._id,
        type: 'claim_release',
        amount: claim.amount,
        currency: claim.currency,
        description: `Saldo liberado por rechazo de solicitud ${claim._id}`,
        balanceAfter: wallet.balance
      });
    }

    if (status === 'paid' && ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - claim.amount);
      wallet.totalPaid += claim.amount;
      claim.paidAt = new Date();
      claim.rejectedReason = undefined;

      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        user: claim.user,
        prize: claim.prize,
        claim: claim._id,
        type: 'claim_paid',
        amount: claim.amount,
        currency: claim.currency,
        description: `Solicitud de cobro pagada ${claim._id}`,
        balanceAfter: wallet.balance
      });
    }

    if (status === 'approved') {
      claim.approvedAt = new Date();
      claim.rejectedReason = undefined;
    }

    if (status === 'pending') {
      claim.rejectedReason = undefined;
      claim.approvedAt = undefined;
      claim.paidAt = undefined;
    }

    claim.status = status;

    await claim.save();

    await saveLog({
      type: 'WALLET-CLAIM-STATUS',
      message: `Solicitud ${claim._id} actualizada a ${status}`,
      user: req.user.id,
      status: 'INFO'
    });

    const updatedClaim = await WalletClaim.findById(id)
      .populate('user', 'username email points')
      .populate('wallet')
      .populate('prize');

    return res.status(200).json(updatedClaim);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
