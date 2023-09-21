import type { Manifest } from 'webextension-polyfill';
import pkg from '../package.json';

const manifest: Manifest.WebExtensionManifest = {
  manifest_version: 3,
  name: pkg.displayName,
  version: pkg.version,
  description: pkg.description,
  background: {
    service_worker: 'js/background/index.js',
    type: 'module',
  },
  action: {
    default_popup: 'index.html',
    default_icon: '32x32.png',
  },
  icons: {
    '16':'16x16.png', 
    '32':'32x32.png', 
    '48':'48x48.png', 
    '128':'128x128.png', 
    '256':'256x256.png', 
    '512':'512x512.png', 
    '1024':'1024x1024.png', 
    '2048':'2048x2048.png'
  },
  permissions: ["activeTab", "storage"],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['js/content/index.js']
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        '16x16.png', 
        '32x32.png', 
        '48x48.png', 
        '128x128.png', 
        '256x256.png', 
        '512x512.png', 
        '1024x1024.png', 
        '2048x2048.png'
      ],
      matches: [],
    },
  ],
};

export default manifest;
