const paymentOperations = require('../services/paymentOperationsService');
const { createLog } = require('./systemLogController');

const overview = async (req, res, next) => {
  try {
    const data = await paymentOperations.getOverview({ limit: req.query.limit });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const requeue = async (req, res, next) => {
  try {
    const result = await paymentOperations.requeueEvent(req.params.eventId);
    if (!result.duplicate) {
      await createLog('warning', `Payment event ${result.event.key} requeued for processing`, 'payment', req.user.id, req.user.email, { eventId: result.event._id }, req);
    }
    res.status(200).json({ message: result.duplicate ? 'Payment event is already queued' : 'Payment event requeued', ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { overview, requeue };
