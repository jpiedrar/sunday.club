"""Integration check against the running local preview; creates a test league."""
import json,urllib.request,urllib.error
BASE='http://localhost:3000'
def request(method,path,body=None,signed=True,origin=None):
 headers={'Content-Type':'application/json'}
 if signed:headers['Cookie']='__sites_local_auth=1'
 if origin:headers['Origin']=origin
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body else None,method=method,headers=headers)
 try:
  with urllib.request.urlopen(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:
  raw=e.read().decode()
  try:body=json.loads(raw)
  except ValueError:body={"error":raw}
  return e.code,body
assert request('GET','/api/club',signed=False)[0]==401
assert request('POST','/api/club',{'action':'create','name':'Blocked'},origin='https://other.test')[0]==403
status,data=request('GET','/api/club?week=1');assert status==200,(status,data)
assert data['games'][0]['away']=='NE' and data['games'][0]['home']=='SEA'
assert data['games'][1]['away']=='SF' and data['games'][1]['home']=='LAR'
assert data['games'][1]['status']=='final' and data['games'][1]['winner']=='SF'
status,result=request('POST','/api/club',{'action':'create','name':'Local verification league'});assert status==200,result
league=result['league']
assert request('GET','/api/club?league=not-a-member')[0]==403
status,state=request('GET',f'/api/club?week=1&league={league}');assert status==200,state
assert all(state['badgeSettings'].values())
enabled_badges=['perfect-week','lone-wolf']
assert request('POST','/api/club',{'action':'badge-settings','league':league,'badges':enabled_badges})[0]==200
configured=request('GET',f'/api/club?week=1&league={league}')[1]['badgeSettings']
assert {badge for badge,enabled in configured.items() if enabled}==set(enabled_badges)
assert state['superBowlDeadline']==1791504900000
assert state['superBowlLockWeek']==5 and state['superBowlPoints']==0
assert request('POST','/api/club',{'action':'super-bowl-settings','league':league,'lockWeek':2,'points':7})[0]==200
configured=request('GET',f'/api/club?week=1&league={league}')[1]
assert configured['superBowlLockWeek']==2 and configured['superBowlPoints']==7
assert configured['superBowlDeadline']==min(game['kickoff'] for game in request('GET',f'/api/club?week=2&league={league}')[1]['games'])
if not state['superBowlLocked']:
 assert request('POST','/api/club',{'action':'super-bowl-pick','league':league,'team':'KC'})[0]==200
 assert request('GET',f'/api/club?week=1&league={league}')[1]['superBowlPick']=='KC'
 assert request('POST','/api/club',{'action':'super-bowl-unpick','league':league})[0]==200
 assert request('POST','/api/club',{'action':'super-bowl-pick','league':league,'team':'KC'})[0]==200
assert len(state['games'])==16
assert 'marketOdds' in state
if state['marketOdds']:
 first_market=next(iter(state['marketOdds'].values()))
 assert first_market['away']+first_market['home']==100
 assert first_market['source']
future=state['games'][-1]
if not state['profile'].get('favoriteTeam'):
 assert request('POST','/api/club',{'action':'pick','league':league,'game':future['id'],'team':future['away']})[0]==409
assert request('POST','/api/club',{'action':'favorite-team','favoriteTeam':future['home']})[0]==200
assert request('POST','/api/club',{'action':'pick','league':league,'game':future['id'],'team':future['away']})[0]==200
assert request('POST','/api/club',{'action':'unpick','league':league,'game':future['id']})[0]==200
status,cleared=request('GET',f'/api/club?week=1&league={league}');assert future['id'] not in cleared['picks']
assert request('POST','/api/club',{'action':'pick','league':league,'game':future['id'],'team':future['away']})[0]==200
assert request('POST','/api/club',{'action':'publish-picks','league':league,'week':1})[0]==200
status,published=request('GET',f'/api/club?week=1&league={league}');assert status==200,published
assert published['picksPublished'] is True
assert published['publishedPicks'][published['profile']['id']][future['id']]==future['away']
assert request('POST','/api/club',{'action':'unpublish-picks','league':league,'week':1})[0]==200
assert request('POST','/api/club',{'action':'pick','league':league,'game':future['id'],'team':'BAD'})[0]==409
status,state=request('GET',f'/api/club?week=1&league={league}');assert state['picks'][future['id']]==future['away']
assert state['pickCounts'][future['id']][future['away']]==1
assert state['memberCompletion'][0]['picked']==1 and state['totalGames']==16
assert state['picksPublished'] is False
assert state['profile']['favoriteTeam']==future['home']
assert state['standings'][0]['againstTeamWeekly']==1
assert state['standings'][0]['wildWeekly']==0
assert future['id'] not in state['revealedGames']
assert future['id'] not in state['publishedPicks'].get(state['profile']['id'],{})
assert len(state['standings'])==1 and state['standings'][0]['monthly']==0 and state['standings'][0]['season']==0
status,week_two=request('GET',f'/api/club?week=2&league={league}');assert status==200,week_two
assert week_two['allPicksComplete'] is False
assert week_two['scheduleOfficial'] is True
assert len(week_two['games'])==16
assert week_two['games'][0]['away']=='DET' and week_two['games'][0]['home']=='BUF'
for game in week_two['games']:
 assert request('POST','/api/club',{'action':'pick','league':league,'game':game['id'],'team':game['away']})[0]==200
status,complete=request('GET',f'/api/club?week=2&league={league}');assert status==200,complete
assert complete['allPicksComplete'] is True
assert complete['memberCompletion'][0]['picked']==complete['totalGames']==16
assert set(complete['revealedGames'])=={game['id'] for game in complete['games']}
assert len(complete['publishedPicks'][complete['profile']['id']])==16
offset_game=complete['games'][0]
assert request('POST','/api/club',{'action':'pick','league':league,'game':offset_game['id'],'team':offset_game['home']})[0]==200
status,offset_state=request('GET',f'/api/club?week=2&league={league}');assert status==200,offset_state
assert offset_game['id'] in offset_state['offsetPicks'][offset_state['profile']['id']]
assert offset_state['publishedPicks'][offset_state['profile']['id']][offset_game['id']]==offset_game['home']
assert request('POST','/api/club',{'action':'remove','league':league,'member':state['profile']['id']})[0]==400
print('PASS: official schedule and results, market probabilities, badge configuration, pick publication, authentication, standings and commissioner protection.')
