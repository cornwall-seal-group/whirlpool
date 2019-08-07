const Joi = require('joi');
const CatalogueController = require('../controllers/catalogue-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/catalogue/process',
        config: {
            description: 'Allows you to submit a catalogue to be processed',
            notes: 'Allows you to submit a PPT catalogue that will extract images of the seals ',
            tags: ['api', 'v1', 'catalogue', 'process'],

            payload: {
                maxBytes: 1048570000
            }
        },

        handler: CatalogueController.processCatalogue
    }
];
