const parseSubdiv = (subdiv) => {
  subdivNum = subdiv.substring(0, subdiv.length - 1);
  return subdiv.indexOf('m') !== -1 ? subdivNum * 128 : 32 / subdivNum;
};

module.exports = { parseSubdiv };

/*
parses subdiv so that the result is a multiple of 32notes to add to a single note of said subdiv, ie parseSubdiv('16n') = 2.

in particular, { '4m': 512, '3m': 384, '2m': 256, '1m': 128, '1n': 32, '2n': 16, '4n': 8, '8n': 4, '16n': 2 };

*/
