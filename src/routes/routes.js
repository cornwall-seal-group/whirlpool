const Joi = require('joi');
const AlbumController = require('../controllers/album-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/album/process',
        config: {
            description: 'Allows you to submit a album to be processed',
            notes: 'Allows you to submit a PPT album that will extract images of the seals ',
            tags: ['api', 'v1', 'album', 'process'],

            payload: {
                maxBytes: 1048570000,
                output: 'stream'
            }
        },
        handler: AlbumController.processAlbum
    }
];
