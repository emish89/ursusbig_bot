export type Chat = {
  id: number;
  type: string;
  username: string;
  first_name: string;
};

export type TelegramResponse = {
  ok: boolean;
  result: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: string;
    };
    date: number;
    text: string;
  };
};

export type GoogleAuthType = {
  _events?: {};
  _eventsCount?: number;
  transporter: {};
  credentials: {
    refresh_token?: string | null | undefined;
  };
  eagerRefreshThresholdMillis: number;
  forceRefreshOnFailure: boolean;
  _clientId?: string | undefined;
  _clientSecret?: string | undefined;
  _refreshToken?: string | null | undefined;
};
