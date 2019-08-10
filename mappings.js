const mappings = require('./seal-mappings/seals.json');

const processMappings = () => {
    let processedSeals = [];
    let masterList = [];
    const uniq = mappings.reduce((seals, item) => {
        const { id, dup } = item;
        if (dup !== '') {
            if (!processedSeals.includes(id)) {
                // Add key seal to processed list
                processedSeals.push(id);
                let master = id;
                const dupSeals = dup.split(' ');
                const index = dupSeals.indexOf(id);
                if (index > -1) {
                    dupSeals.splice(index, 1);
                }

                // Add the duplicated seals to processed list too so we don't re-add them later
                processedSeals.push(...dupSeals);

                // Check if master already set as it'll appear in the processed list
                dupSeals.map(s => {
                    if (masterList.includes(s)) {
                        master = s;
                    }
                });

                dupSeals.map(s => (seals[s] = master));
                seals[id] = master;
                masterList.push(master);
            }
        } else {
            seals[id] = id;
        }
        return seals;
    }, {});

    console.log("Numer of ID'd seals", Object.keys(uniq).length);
    const trulyUnique = Object.keys(uniq).filter(item => uniq[item] === item);
    console.log('Numer of unique seals', Object.keys(trulyUnique).length);

    fs.writeFileSync(`seal-mappings/mappings.json`, JSON.stringify(uniq, null, 2));
};

module.exports = {
    processMappings
};
