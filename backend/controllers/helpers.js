exports.delay = async (time) => {
  const sleep = (ms) => new Promise((awaken) => setTimeout(awaken, ms));
  await sleep(time);
};
