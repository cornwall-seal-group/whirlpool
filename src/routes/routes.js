const AlbumController = require('../controllers/album-controller');
const ZipController = require('../controllers/zipfile-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/album/process',
        config: {
            description: 'Allows you to submit a album to be processed',
            notes: 'Allows you to submit a PPT album that will extract images of the seals',
            tags: ['api', 'v1', 'album', 'process'],
            payload: {
                maxBytes: 1048570000,
                output: 'stream'
            }
        },
        handler: AlbumController.processAlbum
    },
    {
        method: 'POST',
        path: '/api/v1/album/process/bulk',
        config: {
            description: 'Allows you to submit multiple albums to be processed',
            notes: 'Allows you to submit a ZIP file containing multiple albums of seal sightings',
            tags: ['api', 'v1', 'album', 'process'],
            payload: {
                maxBytes: 2147483648,
                output: 'stream'
            }
        },
        handler: AlbumController.processBulkAlbum
    },
    {
        method: 'POST',
        path: '/api/v1/zipfile/process',
        config: {
            description: 'Allows you to upload a zipfile of folders of seals to be processed',
            notes:
                'Allows you to submit a zip file that will extract images of the seals, within it should have a folder per seal',
            tags: ['api', 'v1', 'zipfile', 'process'],

            payload: {
                maxBytes: 2147483648,
                output: 'stream'
            }
        },
        handler: ZipController.process
    }
];
