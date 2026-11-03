export type QobuzUserCredentials = {
    email: string;
    password: string;
};

export type QobuzAppCredentials = {
    appId: string;
    appSecret: string;
};

export type QobuzUserCredential = {
    id: number;
    label: string;
    description: string;
    parameters: {
        lossy_streaming: boolean;
        lossless_streaming: boolean;
        hires_streaming: boolean;
        hires_purchases_streaming: boolean;
        mobile_streaming: boolean;
        offline_streaming: boolean;
        hfp_purchase: boolean;
        included_format_group_ids: number[];
        color_scheme: { logo: string };
        label: string;
        short_label: string;
        source: string;
    };
};

export type QobuzUser = {
    id: number;
    publicId: string;
    email: string;
    login: string;
    display_name: string;
    firstname?: string;
    lastname?: string;
    country_code: string;
    language_code: string;
    zone: string;
    store: string;
    avatar?: string;
    genre?: string;
    age?: number;
    creation_date: string;
    credential?: QobuzUserCredential;
    subscription?: {
        offer: string;
        end_date: string;
        is_canceled: boolean;
        periodicity: string;
        household_size_actual: number;
        household_size_max: number;
    };
};

export type QobuzLoginResponse = {
    user_auth_token: string;
    user: QobuzUser;
};
