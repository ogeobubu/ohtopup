const EmailJob = require('../model/EmailJob');

const retryDelay = attempts => Math.min(60 * 60 * 1000, 30000 * (2 ** Math.max(0, attempts - 1)));

const claim = () => {
  const now = new Date();
  return EmailJob.findOneAndUpdate({
    attempts: { $lt: 5 },
    $or: [
      { status: { $in: ['queued', 'failed'] }, nextAttemptAt: { $lte: now } },
      { status: 'processing', leaseUntil: { $lte: now } },
    ],
  }, {
    $set: { status: 'processing', leaseUntil: new Date(Date.now() + 2 * 60 * 1000) },
    $inc: { attempts: 1 },
  }, { new: true, sort: { nextAttemptAt: 1, createdAt: 1 } });
};

const processOne = async () => {
  const job = await claim();
  if (!job) return false;
  try {
    const result = await require('./emailService').sendEmailDirect({
      to: job.to, subject: job.subject, html: job.html, text: job.text, emailType: job.emailType,
    });
    if (!result.success) throw new Error('Email provider did not accept the message');
    await EmailJob.updateOne({ _id: job._id, status: 'processing' }, {
      $set: { status: 'sent', sentAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      $unset: { leaseUntil: 1, lastError: 1 },
    });
  } catch (error) {
    const exhausted = job.attempts >= job.maxAttempts;
    await EmailJob.updateOne({ _id: job._id }, {
      $set: {
        status: exhausted ? 'failed' : 'queued',
        nextAttemptAt: new Date(Date.now() + retryDelay(job.attempts)),
        lastError: String(error.message || 'Email delivery failed').slice(0, 500),
      },
      $unset: { leaseUntil: 1 },
    });
  }
  return true;
};

const tick = async () => {
  let processed = 0;
  while (processed < 5 && await processOne()) processed++;
  return processed;
};

const start = () => {
  let stopped = false;
  let timer;
  const run = async () => {
    try { await tick(); } catch (error) { console.error('Email worker failed:', error.message); }
    if (!stopped) { timer = setTimeout(run, 10000); timer.unref(); }
  };
  run();
  return () => { stopped = true; clearTimeout(timer); };
};

module.exports = { start, tick, processOne };
