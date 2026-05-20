import Logs from '../models/logs.model';

export const saveLog = async ({
  type,
  message = '',
  user = null,
  status = 'INFO',
}) => {

  try {

    await Logs.create({
      type,
      message,
      user,
      status,
    });

  } catch (error) {

    console.error('Error guardando log:', error);

  }
};