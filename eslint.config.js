// eslint.config.js

import { defineConfig } from 'eslint/config';
import jsdoc from 'eslint-plugin-jsdoc';

export default defineConfig([
    {
        files: ['**/*.js'],
        plugins: {
            jsdoc: jsdoc
        },
        rules: {
            'jsdoc/require-description': 'error',
            'jsdoc/check-values': 'error'
        }
    }
]);
