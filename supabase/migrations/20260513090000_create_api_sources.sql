create table if not exists public.api_sources (
  id text primary key,
  name text not null,
  category text not null check (category in ('Social', 'Events', 'News', 'Open Data', 'Weather', 'Finance')),
  description text not null default '',
  auth_type text not null default 'Unknown',
  https_supported boolean not null default false,
  cors_status text not null default 'Unknown' check (cors_status in ('Yes', 'No', 'Unknown')),
  source_url text not null,
  use_case text not null default '',
  platform_fit text[] not null default '{}',
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high')),
  status text not null default 'candidate' check (status in ('candidate', 'reviewing', 'approved', 'blocked', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_api_sources_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_api_sources_updated_at on public.api_sources;
create trigger trg_api_sources_updated_at
before update on public.api_sources
for each row
execute function public.set_api_sources_updated_at();

alter table public.api_sources enable row level security;

drop policy if exists "api_sources_select_public" on public.api_sources;
create policy "api_sources_select_public"
on public.api_sources
for select
using (true);

insert into public.api_sources (
  id, name, category, description, auth_type, https_supported, cors_status,
  source_url, use_case, platform_fit, risk_level, status
) values
  ('api_social_ayrshare', 'Ayrshare', 'Social', 'Social media APIs to post, get analytics, and manage multiple user social media accounts.', 'apiKey', true, 'Yes', 'https://www.ayrshare.com/', '跨平台社群貼文發布、互動數與熱度追蹤。', array['social_heat', 'content_ops', 'analytics'], 'medium', 'candidate'),
  ('api_social_bluesky', 'Bluesky', 'Social', 'Decentralized social networking via the AT protocol.', 'No', true, 'Yes', 'https://docs.bsky.app/', '監測新興社群提及、粉絲擴散與公開討論串。', array['social_listening', 'fandom_simulation', 'trend_discovery'], 'low', 'candidate'),
  ('api_social_reddit', 'Reddit', 'Social', 'Homepage of the internet.', 'OAuth', true, 'Unknown', 'https://www.reddit.com/dev/api/', '追蹤海外討論、迷因擴散與社群風險訊號。', array['social_listening', 'risk_watch', 'topic_mining'], 'medium', 'candidate'),
  ('api_events_eventbrite', 'Eventbrite', 'Events', 'Find events.', 'OAuth', true, 'Unknown', 'https://www.eventbrite.com/platform/api', '補充偶像活動發現、場地資訊與票務頁連結。', array['event_crawler', 'ticket_intent', 'calendar'], 'medium', 'candidate'),
  ('api_events_seatgeek', 'SeatGeek', 'Events', 'Search events, venues and performers.', 'apiKey', true, 'Unknown', 'https://platform.seatgeek.com/', '活動與場館資料 enrichment，支援市場需求比較。', array['event_enrichment', 'venue_data', 'market_compare'], 'medium', 'candidate'),
  ('api_events_ticketmaster', 'Ticketmaster', 'Events', 'Search events, attractions, or venues.', 'apiKey', true, 'Unknown', 'https://developer.ticketmaster.com/', '大型票務活動資料參照，校準票務需求與曝光節奏。', array['ticketing', 'event_discovery', 'demand_signal'], 'medium', 'candidate'),
  ('api_news_currents', 'Currents', 'News', 'Real-time and historical global news with multilingual support.', 'apiKey', true, 'Yes', 'https://currentsapi.services/', '追蹤偶像產業新聞、爭議事件與跨語言報導。', array['news_monitoring', 'risk_watch', 'multilingual'], 'low', 'candidate'),
  ('api_news_gnews', 'GNews', 'News', 'Search for news from various sources.', 'apiKey', true, 'Yes', 'https://gnews.io/', '收集媒體提及與事件外溢討論，支援風險分析。', array['news_monitoring', 'brand_mentions', 'risk_watch'], 'low', 'candidate'),
  ('api_news_guardian', 'The Guardian', 'News', 'Access all the content The Guardian creates, categorised by tags and section.', 'apiKey', true, 'Unknown', 'https://open-platform.theguardian.com/', '國際新聞與文化內容參照，輔助趨勢背景分析。', array['news_context', 'culture_trends', 'risk_watch'], 'medium', 'candidate'),
  ('api_open_data_taiwan', 'Open Government Taiwan', 'Open Data', 'Taiwan Government Open Data.', 'No', true, 'Unknown', 'https://data.gov.tw/', '場館、交通、行政區與城市資料 enrichment。', array['venue_context', 'transport', 'local_market'], 'low', 'candidate'),
  ('api_open_data_japan', 'Open Government Japan', 'Open Data', 'Japan Government Open Data.', 'No', true, 'Unknown', 'https://www.data.go.jp/', '遠征、日本地區活動與地方市場資訊補強。', array['expedition', 'local_market', 'venue_context'], 'low', 'candidate'),
  ('api_open_data_usa', 'Open Government USA', 'Open Data', 'United States Government Open Data.', 'No', true, 'Unknown', 'https://www.data.gov/', '開放資料 catalog 參照與資料治理流程樣板。', array['data_governance', 'catalog_reference', 'benchmarking'], 'low', 'candidate'),
  ('api_weather_open_meteo', 'Open-Meteo', 'Weather', 'Global weather forecast API for non-commercial use.', 'No', true, 'Yes', 'https://open-meteo.com/', '活動日天氣風險、遠征提醒與現場出席率修正。', array['event_risk', 'attendance_forecast', 'expedition'], 'low', 'approved'),
  ('api_weather_nws', 'US Weather', 'Weather', 'US National Weather Service.', 'No', true, 'Yes', 'https://www.weather.gov/documentation/services-web-api', '美國活動天氣與災害提醒資料參照。', array['event_risk', 'weather_alert', 'touring'], 'low', 'candidate'),
  ('api_weather_weatherapi', 'WeatherAPI', 'Weather', 'Weather API with astronomy and geolocation data.', 'apiKey', true, 'Yes', 'https://www.weatherapi.com/', '活動日預報、空氣與地理資訊補強。', array['event_risk', 'forecast', 'location_context'], 'low', 'candidate'),
  ('api_finance_fred', 'FRED', 'Finance', 'Economic data from the Federal Reserve Bank of St. Louis.', 'apiKey', true, 'Yes', 'https://fred.stlouisfed.org/docs/api/fred/', '總體經濟與消費情緒背景，輔助票價敏感度分析。', array['market_context', 'pricing', 'forecast'], 'low', 'candidate'),
  ('api_finance_alpha_vantage', 'Alpha Vantage', 'Finance', 'Realtime and historical stock data.', 'apiKey', true, 'Unknown', 'https://www.alphavantage.co/', '娛樂產業與市場情緒 proxy，輔助商業環境分析。', array['market_context', 'finance_signal', 'forecast'], 'medium', 'candidate'),
  ('api_finance_ecodb', 'Econdb', 'Finance', 'Global macroeconomic data.', 'No', true, 'Yes', 'https://www.econdb.com/', '跨國市場與遠征成本背景資料。', array['market_context', 'expedition_cost', 'forecast'], 'low', 'candidate')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  auth_type = excluded.auth_type,
  https_supported = excluded.https_supported,
  cors_status = excluded.cors_status,
  source_url = excluded.source_url,
  use_case = excluded.use_case,
  platform_fit = excluded.platform_fit,
  risk_level = excluded.risk_level,
  status = excluded.status;
