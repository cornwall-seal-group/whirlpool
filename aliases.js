const mappings = require('./seal-mappings/mappings.json');

const processAliases = () => {
    const masterList = Object.keys(mappings).reduce((seals, alias) => {
        const master = mappings[alias];

        if (master !== alias) {
            if (!(master in seals)) {
                seals[master] = [];
            }
            seals[master] = seals[master].concat(alias);
        }
        return seals;
    }, {});

    console.log('Numer seals with aliases', Object.keys(masterList).length);

    fs.writeFileSync(`seal-mappings/aliases.json`, JSON.stringify(masterList, null, 2));
};

module.exports = {
    processAliases
};
