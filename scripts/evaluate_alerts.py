from supabase import create_client
import os

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
supabase = create_client(url, key)

rules = supabase.table('user_alert_rules').select('*').execute().data

for rule in rules:
    member_id = rule['member_id']
    score = supabase.table('v_member_latest_scores').select('*').eq('member_id', member_id).single().execute().data

    trigger = False

    if rule['rule_type'] == 'temperature_above':
        trigger = score['temperature_index'] > rule['threshold']
    elif rule['rule_type'] == 'momentum_above':
        trigger = score['momentum_score'] > rule['threshold']

    if trigger:
        supabase.table('user_alert_events').insert({
            'user_id': rule['user_id'],
            'member_id': member_id,
            'rule_type': rule['rule_type']
        }).execute()

print('alerts evaluated')
