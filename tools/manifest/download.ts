import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { API_KEY } from './config';
import { VersionAndSettings } from './common';

const BASE_URL = 'https://www.bungie.net';
const HEADERS = { 'x-api-key': API_KEY };
const CACHE_DIR = path.resolve(__dirname, '.cache');

async function bungieGet(urlPath: string): Promise<Response> {
    const resp = await fetch(`${BASE_URL}/${urlPath}`, { headers: HEADERS });
    if (!resp.ok) {
        throw new Error(`Bungie API error: ${resp.status} ${resp.statusText}`);
    }
    return resp;
}

/** Fetch just the manifest version string (fast, no download). */
export async function fetchManifestVersion(): Promise<string> {
    const resp = await bungieGet('platform/Destiny2/Manifest/');
    const data: any = await resp.json();
    return data.Response.version;
}

/** Download the full manifest DB and core settings. */
export async function download(): Promise<VersionAndSettings> {
    fs.mkdirSync(CACHE_DIR, { recursive: true });

    console.log(` Calling: ${BASE_URL}/platform/Destiny2/Manifest/`);
    const manifestResp = await bungieGet('platform/Destiny2/Manifest/');
    const manifestData: any = await manifestResp.json();
    const version: string = manifestData.Response.version;

    const dbPath: string = manifestData.Response.mobileWorldContentPaths.en;
    console.log('   Got response. Pointed to: ' + dbPath);
    const dbResp = await bungieGet(dbPath.replace(/^\//, ''));
    const dbBuffer = Buffer.from(await dbResp.arrayBuffer());
    console.log('   Got response');
    fs.writeFileSync(path.join(CACHE_DIR, 'destiny2.zip'), dbBuffer);
    console.log(' Wrote destiny2.zip');

    const zip = new JSZip();
    const parsedZip = await zip.loadAsync(dbBuffer);
    console.log(' Parsed zip');
    const key = Object.keys(parsedZip.files)[0];
    console.log(' First file in zip is ' + key);
    const file = zip.file(key);
    if (!file) {
        throw new Error('File not found in zip');
    }
    const content = await file.async('uint8array');
    fs.writeFileSync(path.join(CACHE_DIR, 'destiny2.db'), content);
    console.log(' Wrote destiny2.db');

    console.log(' Getting core settings.');
    const settingsResp = await bungieGet('platform/settings/');
    const settingsData: any = await settingsResp.json();
    console.log(' Returning version: ' + version);

    return {
        version,
        destiny2CoreSettings: settingsData.Response.destiny2CoreSettings
    };
}

export function getDbPath(): string {
    return path.join(CACHE_DIR, 'destiny2.db');
}
