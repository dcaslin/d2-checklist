import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from './config';
import { download, fetchManifestVersion, getDbPath } from './download';
import { generateJsonFromDb } from './cook';
import { save } from './save';

const VERSION_FILE = path.join(PROJECT_ROOT, 'src/assets/destiny2-version.json');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

function readCurrentVersion(): string | null {
    try {
        const raw = fs.readFileSync(VERSION_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function updatePackageJsonManifest(version: string) {
    const raw = fs.readFileSync(PACKAGE_JSON, 'utf8');
    const pkg = JSON.parse(raw);
    pkg.manifest = version;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated package.json manifest to: ${version}`);
}

async function run() {
    const force = process.env.MANIFEST_FORCE === '1';

    console.log('Checking Bungie manifest version...');
    const remoteVersion = await fetchManifestVersion();
    console.log(`Remote version: ${remoteVersion}`);

    if (!force) {
        const localVersion = readCurrentVersion();
        if (localVersion === remoteVersion) {
            console.log('Manifest up to date, skipping download.');
            return;
        }
        if (localVersion) {
            console.log(`Local version: ${localVersion} (outdated)`);
        } else {
            console.log('No local manifest found.');
        }
    } else {
        console.log('Force mode: re-downloading regardless of version.');
    }

    console.log('Downloading manifest...');
    const downloaded = await download();
    console.log('Version: ' + downloaded.version);

    console.log('Processing manifest database...');
    const cache = await generateJsonFromDb(getDbPath(), downloaded.version);
    cache.destiny2CoreSettings = downloaded.destiny2CoreSettings;
    console.log('Tables: ' + Object.keys(cache).join(', '));

    console.log('Saving JSON files...');
    await save(cache);

    updatePackageJsonManifest(downloaded.version);
    console.log('Done.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
