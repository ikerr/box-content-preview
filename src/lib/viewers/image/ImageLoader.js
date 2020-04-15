import AssetLoader from '../AssetLoader';
import ImageViewer from './ImageViewer';
import MultiImageViewer from './MultiImageViewer';
import { ORIGINAL_REP_NAME } from '../../constants';

// Order of the viewers matters. Prefer original before others. Go from specific to general.
// For example, a gif file can be previewed both natively (majority use case) using the original
// representation but can fallback to using the png representation (for watermarked versions).
const VIEWERS = [
    {
        NAME: 'Image',
        CONSTRUCTOR: ImageViewer,
        REP: ORIGINAL_REP_NAME,
        EXT: ['svg', 'gif'],
    },
    {
        NAME: 'MultiImage',
        CONSTRUCTOR: MultiImageViewer,
        REP: 'jpg',
        EXT: ['tif', 'tiff'],
        ASSET: '{page}.jpg',
    },
    {
        NAME: 'MultiImage',
        CONSTRUCTOR: MultiImageViewer,
        REP: 'png',
        EXT: ['tif', 'tiff'],
        ASSET: '{page}.png',
    },
    {
        NAME: 'Image',
        CONSTRUCTOR: ImageViewer,
        REP: 'jpg',
        EXT: ['jpeg', 'jpg', 'cr2', 'crw', 'dng', 'nef', 'raf', 'raw'],
        ASSET: '1.jpg',
    },
    {
        NAME: 'Image',
        CONSTRUCTOR: ImageViewer,
        REP: 'png',
        EXT: ['ai', 'bmp', 'dcm', 'eps', 'gif', 'heic', 'png', 'ps', 'psd', 'svs', 'tga', 'tif', 'tiff'],
        ASSET: '1.png',
    },
];

class ImageLoader extends AssetLoader {
    /**
     * [constructor]
     * @return {ImageLoader} ImageLoader instance
     */
    constructor() {
        super();
        this.viewers = VIEWERS;
    }

    /**
     * Chooses a representation. Assumes that there will be only
     * one specific representation. In other words we will not have
     * two png representation entries with different properties.
     *
     * @param {Object} file - Box file
     * @param {Object} viewer - Chosen Preview viewer
     * @return {Object} The representation to load
     */
    determineRepresentation(file, viewer) {
        return file.representations.entries.find(entry => {
            // Do not use the dimensions=1024x1024&paged=false rep that is for document preloading
            if (entry.properties && entry.properties.paged === 'false') {
                return false;
            }

            return viewer.REP === entry.representation;
        });
    }

    /**
     * @inheritdoc
     */
    determineViewer(file, disabledViewers = []) {
        return this.viewers.find(viewer => {
            if (disabledViewers.indexOf(viewer.NAME) > -1 || viewer.EXT.indexOf(file.extension) === -1) {
                return false;
            }

            const multiPageViewer = (viewer.ASSET || '').indexOf('{page}') !== -1;

            return file.representations.entries.some(entry => {
                if (viewer.REP !== entry.representation) {
                    return false;
                }

                // If the viewer uses paged assets (e.g., image_2048_jpg), then
                // ensure that there is a compatible paged representation.
                const pagedRep = (entry.properties || {}).paged === 'true';

                return !multiPageViewer || pagedRep;
            });
        });
    }
}

export default new ImageLoader();
