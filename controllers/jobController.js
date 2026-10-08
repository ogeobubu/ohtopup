const run = async (req, res, next) => {
  try {
    await require('../services/paymentWorker').tick();
    const emailsProcessed = await require('../services/emailWorker').tick();
    res.json({ message: 'Background jobs completed', emailsProcessed });
  } catch (error) {
    next(Object.assign(new Error('Background jobs could not be completed'), { status: 503, cause: error }));
  }
};

module.exports = { run };
