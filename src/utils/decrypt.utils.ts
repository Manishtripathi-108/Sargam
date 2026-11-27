import type { SongAudio } from '../types/core/song.model';
import type { Provider } from '../validators/common.validators';
import { AppError } from './error.utils';
import { upgradeToHttps } from './url.utils';
import crypto from 'crypto';
import forge from 'node-forge';

// Pre-computed keys
const GAANA_KEY = Buffer.from('Z3kxdCNiQGpsKGIkd3RtZQ==', 'base64');
const SAAVN_KEY = '38346591';

type AudioQuality = readonly [string, string, string, string];

const GAANA_QUALITIES: AudioQuality = ['16.mp4', '64.mp4', '128.mp4', '320.mp4'];
const SAAVN_QUALITIES: AudioQuality = ['_12', '_96', '_160', '_320'];

const buildAudioUrls = (baseUrl: string, pattern: string, qualities: AudioQuality): SongAudio => ({
    very_low: baseUrl.replace(pattern, qualities[0]),
    low: baseUrl.replace(pattern, qualities[1]),
    medium: baseUrl.replace(pattern, qualities[2]),
    high: baseUrl.replace(pattern, qualities[3]),
});

const decryptGaana = (encrypted: string): SongAudio => {
    const ivPosition = Number(encrypted[0]);
    if (Number.isNaN(ivPosition)) {
        throw new AppError('[Gaana] Invalid IV position in encrypted string', 400);
    }

    const iv = Buffer.from(encrypted.slice(ivPosition, ivPosition + 16), 'utf8');
    const cipherText = Buffer.from(encrypted.slice(ivPosition + 16), 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', GAANA_KEY, iv);
    const baseUrl = decipher.update(cipherText, undefined, 'utf8') + decipher.final('utf8');

    return buildAudioUrls(baseUrl, '64.mp4', GAANA_QUALITIES);
};

const decryptSaavn = (encrypted: string): SongAudio => {
    const decipher = forge.cipher.createDecipher('DES-ECB', SAAVN_KEY);

    decipher.start();
    decipher.update(forge.util.createBuffer(forge.util.decode64(encrypted)));
    if (!decipher.finish()) {
        throw new AppError('[Saavn] Failed to decrypt audio URL', 500);
    }

    const baseUrl = upgradeToHttps(decipher.output.getBytes());

    return buildAudioUrls(upgradeToHttps(baseUrl), '_96', SAAVN_QUALITIES);
};

export const decryptAudio = (provider: Provider, encrypted?: string): SongAudio => {
    if (!encrypted) {
        throw new AppError(`[${provider}] Encrypted string is required`, 400);
    }

    switch (provider) {
        case 'gaana':
            return decryptGaana(encrypted);
        case 'saavn':
            return decryptSaavn(encrypted);
        default:
            throw new AppError(`Unsupported provider: ${provider}`, 400);
    }
};
