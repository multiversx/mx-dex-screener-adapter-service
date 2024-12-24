const axios = require('axios');

const run = async () => {
  const { data: events } = await axios.get('https://tools.multiversx.com/dex-screener-adapter/events?fromBlock=22896490&toBlock=22896889');

  const addresses = new Set();
  for (const event of events.events) {
    addresses.add(event.pairId);
  }

  for (const address of addresses) {
    const { data } = await axios.get(`https://tools.multiversx.com/dex-screener-adapter/pair?id=${address}`);
    console.log(address, data.pair.dexKey);
  }
};

run();