import Raffle from '../models/raffle.model.js';
import RaffleTicket from '../models/raffleTicket.model.js';
import User from '../models/user.model.js';
import { saveLog } from '../utils/logs.js';
import mongoose from 'mongoose';

const ACTIVE_STATUSES = ['active'];

const mapRaffle = (raffle, userTicketCounts = {}) => {
  if (!raffle) return null;

  const raffleObject = raffle.toObject ? raffle.toObject() : raffle;
  const id = String(raffleObject._id);

  return {
    ...raffleObject,
    totalTickets: raffleObject.ticketsSold || 0,
    userTickets: userTicketCounts[id] || 0
  };
};

const getUserTicketCounts = async (userId, raffleIds = []) => {
  if (!raffleIds.length) return {};
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const counts = await RaffleTicket.aggregate([
    {
      $match: {
        user: userObjectId,
        raffle: { $in: raffleIds }
      }
    },
    {
      $group: {
        _id: '$raffle',
        count: { $sum: 1 }
      }
    }
  ]);

  return counts.reduce((acc, item) => {
    acc[String(item._id)] = item.count;
    return acc;
  }, {});
};

const getWinners = async (limit = 5) => {
  const raffles = await Raffle.find({
    status: { $in: ['drawn', 'delivered'] },
    winner: { $exists: true, $ne: null }
  })
    .populate('winner', 'username email')
    .populate('winningTicket', 'ticketNumber')
    .sort({ drawnAt: -1, updatedAt: -1 })
    .limit(limit);

  return raffles.map((raffle) => ({
    raffle: raffle._id,
    title: raffle.title,
    prizeName: raffle.prizeName,
    winner: raffle.winner,
    ticketNumber: raffle.winningTicket?.ticketNumber,
    drawnAt: raffle.drawnAt
  }));
};

const getClaimStatus = (raffle) => {
  if (raffle.claimStatus) return raffle.claimStatus;
  if (raffle.status === 'delivered') return 'delivered';
  return 'unclaimed';
};

const mapPrize = (raffle) => ({
  _id: raffle._id,
  title: raffle.title,
  prizeName: raffle.prizeName,
  description: raffle.description,
  image: raffle.image,
  status: raffle.status,
  claimStatus: getClaimStatus(raffle),
  claimedAt: raffle.claimedAt,
  deliveredAt: raffle.deliveredAt,
  drawnAt: raffle.drawnAt,
  ticketNumber: raffle.winningTicket?.ticketNumber
});

export const getRaffles = async (req, res) => {
  try {
    const now = new Date();
    const user = await User.findById(req.user.id).select('credits');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const activeRaffles = await Raffle.find({
      status: { $in: ACTIVE_STATUSES },
      startsAt: { $lte: now },
      endsAt: { $gt: now }
    }).sort({ featured: -1, endsAt: 1, createdAt: -1 });

    const raffleIds = activeRaffles.map((raffle) => raffle._id);
    const userTicketCounts = await getUserTicketCounts(user._id, raffleIds);
    const mappedRaffles = activeRaffles.map((raffle) => mapRaffle(raffle, userTicketCounts));
    const featured = mappedRaffles.find((raffle) => raffle.featured) || mappedRaffles[0] || null;
    const myTickets = mappedRaffles
      .filter((raffle) => raffle.userTickets > 0)
      .map((raffle) => ({
        raffle: raffle._id,
        title: raffle.title,
        prizeName: raffle.prizeName,
        userTickets: raffle.userTickets
      }));

    return res.status(200).json({
      balance: user.credits || 0,
      featured,
      activeRaffles: mappedRaffles,
      myTickets,
      winners: await getWinners()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getRaffleById = async (req, res) => {
  try {
    const raffle = await Raffle.findById(req.params.id)
      .populate('winner', 'username email')
      .populate('winningTicket', 'ticketNumber');

    if (!raffle) {
      return res.status(404).json({ message: 'Sorteo no encontrado' });
    }

    const userTicketCounts = await getUserTicketCounts(req.user.id, [raffle._id]);

    return res.status(200).json(mapRaffle(raffle, userTicketCounts));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getAdminRaffles = async (req, res) => {
  try {
    const raffles = await Raffle.find()
      .populate('winner', 'username email')
      .populate('winningTicket', 'ticketNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json(raffles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const buyTickets = async (req, res) => {
  const quantity = Number(req.body.quantity || 1);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return res.status(400).json({ message: 'Cantidad de tickets invalida' });
  }

  let chargedUser = null;
  let updatedRaffle = null;
  const now = new Date();

  try {
    const raffle = await Raffle.findOne({
      _id: req.params.id,
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gt: now }
    });

    if (!raffle) {
      return res.status(404).json({ message: 'Sorteo no disponible' });
    }

    const totalCost = raffle.costPerTicket * quantity;

    chargedUser = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        credits: { $gte: totalCost }
      },
      { $inc: { credits: -totalCost } },
      { new: true }
    ).select('credits');

    if (!chargedUser) {
      return res.status(400).json({ message: 'RM coins insuficientes' });
    }

    updatedRaffle = await Raffle.findOneAndUpdate(
      {
        _id: raffle._id,
        status: 'active',
        endsAt: { $gt: now }
      },
      { $inc: { ticketsSold: quantity } },
      { new: true }
    );

    if (!updatedRaffle) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { credits: totalCost } });
      return res.status(400).json({ message: 'El sorteo ya no esta disponible' });
    }

    const firstTicketNumber = updatedRaffle.ticketsSold - quantity + 1;
    const tickets = Array.from({ length: quantity }, (_, index) => ({
      raffle: updatedRaffle._id,
      user: req.user.id,
      ticketNumber: firstTicketNumber + index,
      cost: raffle.costPerTicket
    }));

    await RaffleTicket.insertMany(tickets);

    await saveLog({
      type: 'RAFFLE-TICKETS-BOUGHT',
      message: `Usuario ${req.user.id} compro ${quantity} tickets para sorteo ${updatedRaffle._id}`,
      user: req.user.id,
      status: 'INFO'
    });

    const userTicketCounts = await getUserTicketCounts(req.user.id, [updatedRaffle._id]);

    return res.status(201).json({
      balance: chargedUser.credits,
      raffle: mapRaffle(updatedRaffle, userTicketCounts),
      tickets
    });
  } catch (error) {
    console.error(error);

    if (chargedUser && updatedRaffle) {
      const refundAmount = quantity * (updatedRaffle.costPerTicket || 0);
      await User.findByIdAndUpdate(req.user.id, { $inc: { credits: refundAmount } });
      await Raffle.findByIdAndUpdate(updatedRaffle._id, { $inc: { ticketsSold: -quantity } });
    }

    return res.status(500).json({ message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await RaffleTicket.find({ user: req.user.id })
      .populate('raffle')
      .sort({ createdAt: -1 });

    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRecentWinners = async (req, res) => {
  try {
    return res.status(200).json(await getWinners(Number(req.query.limit || 5)));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyPrizes = async (req, res) => {
  try {
    const raffles = await Raffle.find({
      winner: req.user.id,
      status: { $in: ['drawn', 'delivered'] }
    })
      .populate('winningTicket', 'ticketNumber')
      .sort({ drawnAt: -1, updatedAt: -1 });

    return res.status(200).json(raffles.map(mapPrize));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const claimPrize = async (req, res) => {
  try {
    const raffle = await Raffle.findOne({
      _id: req.params.id,
      winner: req.user.id,
      status: { $in: ['drawn', 'delivered'] }
    }).populate('winningTicket', 'ticketNumber');

    if (!raffle) {
      return res.status(404).json({ message: 'Premio no encontrado' });
    }

    const claimStatus = getClaimStatus(raffle);

    if (claimStatus === 'delivered' || raffle.status === 'delivered') {
      return res.status(400).json({ message: 'Este premio ya fue entregado' });
    }

    if (claimStatus === 'claimed') {
      return res.status(200).json(mapPrize(raffle));
    }

    raffle.claimStatus = 'claimed';
    raffle.claimedAt = new Date();
    await raffle.save();

    await saveLog({
      type: 'RAFFLE-PRIZE-CLAIMED',
      message: `Usuario ${req.user.id} reclamo premio del sorteo ${raffle._id}`,
      user: req.user.id,
      status: 'INFO'
    });

    return res.status(200).json(mapPrize(raffle));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const createRaffle = async (req, res) => {
  try {
    const raffle = new Raffle(req.body);

    if (req.file) {
      raffle.setImgUrl(req.file.filename);
    }

    const savedRaffle = await raffle.save();

    return res.status(201).json(savedRaffle);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateRaffle = async (req, res) => {
  try {
    const blockedFields = ['ticketsSold', 'winner', 'winningTicket', 'claimStatus', 'claimedAt', 'drawnAt', 'deliveredAt'];
    const data = { ...req.body };

    blockedFields.forEach((field) => delete data[field]);

    const raffle = await Raffle.findById(req.params.id);

    if (!raffle) {
      return res.status(404).json({ message: 'Sorteo no encontrado' });
    }

    Object.assign(raffle, data);

    if (req.file) {
      raffle.setImgUrl(req.file.filename);
    }

    const updatedRaffle = await raffle.save();

    return res.status(200).json(updatedRaffle);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateRaffleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['draft', 'active', 'closed', 'cancelled', 'delivered'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }

    const update = { status };

    if (status === 'delivered') {
      update.deliveredAt = new Date();
      update.claimStatus = 'delivered';
    }

    const raffle = await Raffle.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!raffle) {
      return res.status(404).json({ message: 'Sorteo no encontrado' });
    }

    return res.status(200).json(raffle);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const drawRaffle = async (req, res) => {
  try {
    const raffle = await Raffle.findById(req.params.id);

    if (!raffle) {
      return res.status(404).json({ message: 'Sorteo no encontrado' });
    }

    if (raffle.status === 'drawn' || raffle.status === 'delivered') {
      return res.status(400).json({ message: 'El sorteo ya fue realizado' });
    }

    const endedActiveRaffle = raffle.status === 'active' && raffle.endsAt <= new Date();

    if (raffle.status !== 'closed' && !endedActiveRaffle) {
      return res.status(400).json({ message: 'El sorteo no esta listo para realizarse' });
    }

    const totalTickets = await RaffleTicket.countDocuments({ raffle: raffle._id });

    if (!totalTickets) {
      return res.status(400).json({ message: 'El sorteo no tiene tickets' });
    }

    const randomIndex = Math.floor(Math.random() * totalTickets);
    const winningTicket = await RaffleTicket.findOne({ raffle: raffle._id })
      .skip(randomIndex)
      .populate('user', 'username email');

    raffle.status = 'drawn';
    raffle.winner = winningTicket.user._id;
    raffle.winningTicket = winningTicket._id;
    raffle.claimStatus = 'unclaimed';
    raffle.claimedAt = undefined;
    raffle.drawnAt = new Date();

    await raffle.save();

    await saveLog({
      type: 'RAFFLE-DRAWN',
      message: `Sorteo ${raffle._id} ganado por ${winningTicket.user._id}`,
      user: req.user.id,
      status: 'INFO'
    });

    return res.status(200).json({
      raffle,
      winningTicket
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
