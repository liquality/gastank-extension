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
    '57':'57x57.png', 
    '60':'60x60.png', 
    '72':'72x72.png', 
    '76':'76x76.png', 
    '96':'96x96.png'
  },
  permissions: ["activeTab", "storage"],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['js/content/index.js'],
      "all_frames": true,
      "run_at": "document_start"
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        '16x16.png', 
        '32x32.png', 
        '57x57.png', 
        '60x60.png', 
        '72x72.png', 
        '76x76.png', 
        '96x96.png'
      ],
      matches: [],
    },
  ],
};

export default manifest;
