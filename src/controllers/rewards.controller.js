import User from '../models/user.model';

export const rewardAd = async (req, res) => {

  try {

    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // validar cambio de día
    const today = new Date().toDateString();
    const lastDay = new Date(user.lastAdsDate).toDateString();

    // reset diario
    if (today !== lastDay) {

      user.adsViewedToday = 0;
      user.lastAdsDate = new Date();
    }

    // límite diario
    if (user.adsViewedToday >= 5) {

      return res.status(400).json({
        message: 'Superaste el limite diario, Vuelve mañana'
      });
    }

    // sumar crédito
    user.credits += 1;

    // sumar anuncio visto
    user.adsViewedToday += 1;

    await user.save();

    return res.status(200).json({

      credits: user.credits,
      adsViewedToday: user.adsViewedToday

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};


export const getRewardStatus = async (req, res) => {

  try {

    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const today = new Date().toDateString();

    const lastDay = new Date(user.lastAdsDate).toDateString();

    if (today !== lastDay) {

      user.adsViewedToday = 0;

      user.lastAdsDate = new Date();

      await user.save();
    }

    return res.status(200).json({

      credits: user.credits,
      adsViewedToday: user.adsViewedToday

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};