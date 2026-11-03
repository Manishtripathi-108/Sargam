import { AppError } from '../utils/error.utils';
import type { Provider } from '../validators/common.validators';
import { GaanaProvider } from './gaana/gaana.provider';
import { QobuzProvider } from './qobuz/qobuz.provider';
import { SaavnProvider } from './saavn/saavn.provider';
import { TidalProvider } from './tidal/tidal.provider';

export type ServiceOptions = {
    provider: Provider;
};

export const providerRegistry = {
    qobuz: QobuzProvider,
    saavn: SaavnProvider,
    gaana: GaanaProvider,
    tidal: TidalProvider,
};

/**
 * Resolves a provider instance based on the given options.
 * Defaults to 'saavn' if no provider is specified.
 * @param opts - Service options containing the provider name.
 * @returns The provider instance.
 * @throws {AppError} If the provider is not found in the registry.
 * @example
 * resolveProvider({ provider: 'saavn' }) => SaavnProvider
 * resolveProvider({ provider: 'gaana' }) => GaanaProvider
 */
export function resolveProvider(opts: ServiceOptions) {
    const provider = providerRegistry[opts.provider];
    if (!provider) {
        throw new AppError('Provider not found', 500);
    }
    return provider;
}

export { GaanaProvider, QobuzProvider, SaavnProvider, TidalProvider };
